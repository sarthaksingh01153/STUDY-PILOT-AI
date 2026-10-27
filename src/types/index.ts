/**
 * Core type definitions for StudyPilot AI.
 * These types are shared across the React frontend and mirror the backend API contracts.
 */

// -------------------------------------------------------------
// Note Summaries & Concept Extraction
// -------------------------------------------------------------

export interface KeyConcept {
  term: string;
  definition: string;
  importance: 'high' | 'medium' | 'low';
}

export interface NoteSummary {
  id: string;
  title: string;
  rawText: string;
  summary: string;
  keyConcepts: KeyConcept[];
  examPoints: string[];
  createdAt: string;
  wordCount: number;
}

export interface SummaryRequest {
  text: string;
  title?: string;
}

export interface SummaryResponse {
  title: string;
  summary: string;
  keyConcepts: KeyConcept[];
  examPoints: string[];
  wordCount: number;
}

// -------------------------------------------------------------
// AI Tutor Chat
// -------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** Indicates whether the answer was grounded directly in the provided study material */
  groundedInNotes?: boolean;
  citations?: string[];
}

export interface TutorRequest {
  message: string;
  notesContext: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface TutorResponse {
  reply: string;
  groundedInNotes: boolean;
  citations: string[];
}

// -------------------------------------------------------------
// AI Quiz & Deterministic Scoring
// -------------------------------------------------------------

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export interface Quiz {
  id: string;
  title: string;
  createdAt: string;
  sourceNoteId?: string;
  questions: QuizQuestion[];
}

export interface TopicScore {
  topic: string;
  total: number;
  correct: number;
  accuracy: number; // 0 - 100 percentage
  isWeak: boolean;  // True if accuracy < 60%
}

export interface QuizDetailedAnswer {
  questionIndex: number;
  question: string;
  topic: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  completedAt: string;
  topicBreakdown: Record<string, TopicScore>;
  weakTopics: string[];
  strongTopics: string[];
  detailedAnswers: QuizDetailedAnswer[];
}

export interface QuizRequest {
  text: string;
  questionCount?: number;
}

export interface QuizResponse {
  title: string;
  questions: QuizQuestion[];
}

// -------------------------------------------------------------
// AI Study Agent & Study Planner
// -------------------------------------------------------------

export interface StudyTask {
  id: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedMinutes: number;
  recommendedActivity: string;
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  createdAt: string;
  targetExamDate: string;
  dailyAvailableMinutes: number;
  overallDiagnosis: string;
  weakTopicsIdentified: string[];
  tasks: StudyTask[];
}

export interface StudyPlanRequest {
  weakTopics: TopicScore[];
  strongTopics: TopicScore[];
  targetExamDate: string;
  dailyAvailableMinutes: number;
  studyNotesSnippet?: string;
}

export interface StudyPlanResponse {
  overallDiagnosis: string;
  tasks: Array<Omit<StudyTask, 'id' | 'completed'>>;
}

// -------------------------------------------------------------
// Server Health & Status
// -------------------------------------------------------------

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  geminiConfigured: boolean;
  model: string;
  message?: string;
}
