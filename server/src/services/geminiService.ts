/**
 * Google Gemini Integration Service
 * Uses official @google/genai SDK to generate summaries, quizzes, tutor responses, and study schedules.
 * Includes resilience with model fallback and backoff retry for transient Google 503/429 spikes.
 */

import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env';
import {
  SummaryResponseBody,
  QuizResponseBody,
  TutorResponseBody,
  StudyPlanResponseBody,
  TopicScoreInput,
} from '../types';

/**
 * Helper to ensure a valid GoogleGenAI client is initialized.
 */
function getAiClient(): GoogleGenAI {
  if (!config.isGeminiConfigured) {
    throw new Error(
      'Google Gemini API key is missing. Please add your GEMINI_API_KEY to server/.env and restart the server.'
    );
  }
  return new GoogleGenAI({ apiKey: config.geminiApiKey });
}

/**
 * Robust wrapper that retries on Google API 503 (temporary high demand) and falls back to alternate models.
 */
async function generateWithRetry(prompt: string) {
  const ai = getAiClient();
  const models = [
    config.geminiModel,
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
  ];
  const uniqueModels = Array.from(new Set(models));

  let lastError: Error | unknown = null;

  for (const model of uniqueModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        return response;
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : JSON.stringify(err);
        // If temporary high demand or rate limit, wait and retry
        if (msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE')) {
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
          continue;
        }
        // If model not found or other non-transient error, try next candidate model
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Extracts and parses a JSON object from Gemini output, safely stripping markdown fences.
 */
function extractJson<T>(rawText: string | undefined): T {
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }

  // Remove markdown code fences like ```json and ```
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (err: unknown) {
    // Attempt fallback by matching first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const sliced = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(sliced) as T;
      } catch {
        // Fall through to error
      }
    }
    const msg = err instanceof Error ? err.message : 'Unknown JSON parse error';
    throw new Error(`Failed to parse structured JSON from Gemini response: ${msg}`);
  }
}

export const geminiService = {
  /**
   * Generates a concise summary, key definitions, and high-yield exam points.
   */
  async generateSummary(text: string, title?: string): Promise<SummaryResponseBody> {
    const prompt = `
You are an expert academic tutor and study assistant in StudyPilot AI.
Analyze the following study material and produce a high-yield, structured revision summary in valid JSON format.

STUDY MATERIAL:
${text}

INSTRUCTIONS:
1. "title": A concise, descriptive topic title (use "${title || ''}" if appropriate, otherwise deduce from content).
2. "summary": An intuitive, comprehensive executive summary (2-4 clear paragraphs).
3. "keyConcepts": An array of core concepts, each with:
   - "term": Name of the concept or term
   - "definition": Clear, precise explanation
   - "importance": "high" | "medium" | "low"
4. "examPoints": An array of 4-8 bullet points of high-probability exam topics, common traps, or revision formulas.

Return ONLY raw JSON with this exact schema (no additional markdown text outside the JSON):
{
  "title": "string",
  "summary": "string",
  "keyConcepts": [
    { "term": "string", "definition": "string", "importance": "high" }
  ],
  "examPoints": ["string"]
}
`;

    const response = await generateWithRetry(prompt);
    const parsed = extractJson<SummaryResponseBody>(response.text);

    return {
      title: parsed.title || title || 'Study Notes Summary',
      summary: parsed.summary || 'Summary generated.',
      keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
      examPoints: Array.isArray(parsed.examPoints) ? parsed.examPoints : [],
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  },

  /**
   * Generates multiple-choice quiz questions based strictly on the study material.
   */
  async generateQuiz(text: string, questionCount = 5): Promise<QuizResponseBody> {
    const prompt = `
You are an academic test designer in StudyPilot AI.
Generate exactly ${questionCount} multiple-choice questions (MCQs) based strictly on the study material provided below.

STUDY MATERIAL:
${text}

RULES:
1. Each question must have exactly 4 plausible options.
2. "correctIndex" MUST be an integer between 0 and 3 corresponding to the correct option in "options".
3. "explanation" MUST clearly explain why the correct option is right.
4. "topic" MUST be a short (1-3 word) category/topic name representing the sub-concept being tested (e.g., "Memory Architecture", "Photosynthesis", "Derivatives").
5. The questions must test conceptual understanding, not trivial trivia.

Return ONLY valid JSON matching this exact structure:
{
  "title": "Quiz Title",
  "questions": [
    {
      "id": "q1",
      "question": "What is ...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Because...",
      "topic": "Subtopic Name"
    }
  ]
}
`;

    const response = await generateWithRetry(prompt);
    const parsed = extractJson<QuizResponseBody>(response.text);

    // Validate and normalize questions
    const validatedQuestions = (parsed.questions || []).map((q, idx) => ({
      id: q.id || `q-${Date.now()}-${idx + 1}`,
      question: q.question || `Question ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
      correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
      explanation: q.explanation || 'No explanation provided.',
      topic: q.topic ? q.topic.trim() : 'General',
    }));

    return {
      title: parsed.title || 'Practice Quiz',
      questions: validatedQuestions,
    };
  },

  /**
   * Builds the natural, conversational prompt for AI Tutor.
   */
  buildTutorPrompt(
    message: string,
    notesContext: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    const historyPrompt = (history || [])
      .slice(-8)
      .map((h) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`)
      .join('\n');

    const hasNotes = notesContext && notesContext.trim().length > 0;

    return `
You are StudyPilot AI Tutor, an intelligent, friendly, and fast personal academic tutor.
You communicate naturally, encouragingly, and adaptively with students, similar to ChatGPT.

CONVERSATIONAL RULES:
1. GREETINGS & CASUAL CHAT: If the student says "Hi", "Hello", "How are you", "I'm bored", "Tell me a joke", "Thanks", or makes small talk, reply naturally, warmly, and briefly (1-2 sentences). Do NOT force a lesson, do NOT give robotic disclaimers, and do NOT recite rules.
2. CODING & TECHNICAL QUESTIONS: When asked for programming or technical help (e.g., "Explain C++ loops", "What is malloc"), give a concise, clear explanation followed by a clean, readable code example.
3. ACADEMIC EXPLANATIONS: Explain concepts clearly and step-by-step. If the student says "I don't understand", explain it again using a simpler analogy or intuitive example.
4. UPLOADED STUDY NOTES CONTEXT:
${
  hasNotes
    ? `The student has provided the following study material:\n"""\n${notesContext.substring(0, 8000)}\n"""\n- When the question relates to this study material, answer faithfully using this content and cite key terms.\n- If the student asks a question outside these notes, answer it naturally from your knowledge without making them feel bad or giving robotic error disclaimers.`
    : `(No specific study material attached. Answer from general knowledge.)`
}

5. TONE: Warm, intelligent, concise, and helpful. Use clean Markdown (bullet points, bold text, and code blocks where helpful).

RECENT CHAT HISTORY:
${historyPrompt || '(Start of conversation)'}

STUDENT: ${message}
TUTOR:`;
  },

  /**
   * Streams conversational response progressively chunk by chunk using @google/genai SDK.
   */
  async streamTutorReply(
    message: string,
    notesContext: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> | undefined,
    onChunk: (chunk: string) => void,
    abortSignal?: AbortSignal
  ): Promise<string> {
    const ai = getAiClient();
    const prompt = this.buildTutorPrompt(message, notesContext, history);

    const models = [
      config.geminiModel,
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
    ];
    const uniqueModels = Array.from(new Set(models));

    let fullReply = '';

    for (const model of uniqueModels) {
      if (abortSignal?.aborted) break;
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: prompt,
        });

        for await (const chunk of stream) {
          if (abortSignal?.aborted) break;
          const text = chunk.text;
          if (text) {
            fullReply += text;
            onChunk(text);
          }
        }
        return fullReply;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE')) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        // Try fallback model
      }
    }

    if (!fullReply && abortSignal?.aborted) {
      return '';
    }
    if (!fullReply) {
      throw new Error('Unable to complete streaming response from Gemini.');
    }
    return fullReply;
  },

  /**
   * Responds to student queries with natural, conversational tutor intelligence (non-streaming fallback).
   */
  async askTutor(
    message: string,
    notesContext: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<TutorResponseBody> {
    const prompt = this.buildTutorPrompt(message, notesContext, history);
    const response = await generateWithRetry(prompt);
    const replyText = response.text || 'I am here to help you study!';

    // Check if the reply drew from the provided notes
    const isNotesRelated =
      Boolean(notesContext) &&
      notesContext.length > 50 &&
      !message.toLowerCase().match(/^(hi|hello|hey|how are you|joke|thanks|bye)/);

    return {
      reply: replyText.trim(),
      groundedInNotes: isNotesRelated,
      citations: isNotesRelated ? ['Study Notes'] : [],
    };
  },

  /**
   * Generates a personalized revision plan tailored to identified weak topics (<60% accuracy).
   */
  async generateStudyPlan(
    weakTopics: TopicScoreInput[],
    strongTopics: TopicScoreInput[],
    targetExamDate: string,
    dailyMinutes: number,
    notesSnippet?: string
  ): Promise<StudyPlanResponseBody> {
    const prompt = `
You are the StudyPilot AI Study Agent.
You analyze real quiz performance to create a realistic, personalized revision timetable.

STUDENT PERFORMANCE DATA (Calculated deterministically):
- Weak Topics (<60% accuracy):
${
  weakTopics.length > 0
    ? weakTopics
        .map(
          (w) =>
            `  * ${w.topic}: ${w.accuracy}% accuracy (${w.correct}/${w.total} correct) [HIGH PRIORITY REVISION NEEDED]`
        )
        .join('\n')
    : '  None! The student scored >= 60% on all topics.'
}

- Strong Topics (>=60% accuracy):
${
  strongTopics.length > 0
    ? strongTopics
        .map((s) => `  * ${s.topic}: ${s.accuracy}% accuracy (${s.correct}/${s.total} correct)`)
        .join('\n')
    : '  None yet.'
}

STUDENT CONSTRAINTS:
- Target Exam Date: ${targetExamDate || 'Upcoming within 1-2 weeks'}
- Daily Study Time Available: ${dailyMinutes} minutes/day
${notesSnippet ? `- Context Notes Snippet: ${notesSnippet.substring(0, 500)}...` : ''}

INSTRUCTIONS:
1. "overallDiagnosis": A frank, motivating 2-3 sentence diagnosis of what the student should focus on based on their weak topics.
2. "tasks": Generate an actionable list of revision tasks (between 3 and 6 tasks).
   - Prioritize the weak topics first with "priority": "high".
   - Allocate reasonable durations in minutes (e.g. 15, 25, 30, 45 mins) fitting into their daily allowance.
   - For each task, supply:
     - "topic": Name of the topic
     - "priority": "high" | "medium" | "low"
     - "reason": Clear reason referencing their actual performance (e.g. "Scored 33% on quiz. Need to master core definitions.")
     - "estimatedMinutes": Number of minutes
     - "recommendedActivity": Specific active recall activity (e.g., "Active recall with flashcards", "Draw memory diagram", "Code 3 test cases")

Return ONLY valid JSON matching:
{
  "overallDiagnosis": "string",
  "tasks": [
    {
      "topic": "string",
      "priority": "high",
      "reason": "string",
      "estimatedMinutes": 30,
      "recommendedActivity": "string"
    }
  ]
}
`;

    const response = await generateWithRetry(prompt);
    const parsed = extractJson<StudyPlanResponseBody>(response.text);

    return {
      overallDiagnosis: parsed.overallDiagnosis || 'Personalized study schedule generated.',
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    };
  },
};
