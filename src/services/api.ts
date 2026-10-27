/**
 * StudyPilot AI API Client
 * Communicates with the Express backend server.
 * All Gemini interactions and PDF processing occur securely on the backend.
 */

import {
  HealthResponse,
  SummaryRequest,
  SummaryResponse,
  QuizRequest,
  QuizResponse,
  TutorRequest,
  TutorResponse,
  StudyPlanRequest,
  StudyPlanResponse,
} from '../types';

const API_BASE = '/api';

/**
 * Helper to handle fetch responses and parse descriptive errors.
 */
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Server error (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) {
        errorMessage = data.error;
      }
    } catch {
      // If response wasn't JSON, retain status message
    }
    throw new Error(errorMessage);
  }
  return res.json() as Promise<T>;
}

export const api = {
  /**
   * Health check to inspect backend status and whether GEMINI_API_KEY is configured.
   */
  async getHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await handleResponse<HealthResponse>(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Backend unreachable';
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime: 0,
        geminiConfigured: false,
        model: 'unknown',
        message: `Backend connection issue: ${message}. Ensure Express server is running on port 5000.`,
      };
    }
  },

  /**
   * Extract readable text from an uploaded PDF file via backend PDF service.
   */
  async extractPdfText(file: File): Promise<{ text: string; pageCount: number; charCount: number }> {
    const formData = new FormData();
    formData.append('pdf', file);

    const res = await fetch(`${API_BASE}/summary/extract-pdf`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ text: string; pageCount: number; charCount: number }>(res);
  },

  /**
   * Generate structured summaries, key concepts, and exam revision points from notes.
   */
  async generateSummary(payload: SummaryRequest): Promise<SummaryResponse> {
    const res = await fetch(`${API_BASE}/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<SummaryResponse>(res);
  },

  /**
   * Ask AI Tutor with real-time progressive streaming over Server-Sent Events (SSE).
   */
  async askTutorStream(
    payload: TutorRequest,
    onChunk: (text: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const res = await fetch(`${API_BASE}/tutor/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      try {
        const data = await res.json();
        if (data && data.error) errorMsg = data.error;
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('Streaming not supported by browser environment.');
    }

    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            accumulated += parsed.text;
            onChunk(parsed.text);
          }
        } catch (e: unknown) {
          if (e instanceof Error && e.message !== dataStr) throw e;
        }
      }
    }

    return accumulated;
  },

  /**
   * Ask AI Tutor a question with study material grounded context (non-streaming fallback).
   */
  async askTutor(payload: TutorRequest): Promise<TutorResponse> {
    const res = await fetch(`${API_BASE}/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<TutorResponse>(res);
  },

  /**
   * Generate multiple-choice quiz questions based on study materials.
   */
  async generateQuiz(payload: QuizRequest): Promise<QuizResponse> {
    const res = await fetch(`${API_BASE}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<QuizResponse>(res);
  },

  /**
   * Generate a personalized revision plan based on quiz performance and weak topics.
   */
  async generateStudyPlan(payload: StudyPlanRequest): Promise<StudyPlanResponse> {
    const res = await fetch(`${API_BASE}/study-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<StudyPlanResponse>(res);
  },
};
