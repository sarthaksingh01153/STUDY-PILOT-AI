/**
 * Backend type definitions for StudyPilot AI server.
 */

export interface KeyConcept {
  term: string;
  definition: string;
  importance: 'high' | 'medium' | 'low';
}

export interface SummaryRequestBody {
  text: string;
  title?: string;
}

export interface SummaryResponseBody {
  title: string;
  summary: string;
  keyConcepts: KeyConcept[];
  examPoints: string[];
  wordCount: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export interface QuizRequestBody {
  text: string;
  questionCount?: number;
}

export interface QuizResponseBody {
  title: string;
  questions: QuizQuestion[];
}

export interface TutorRequestBody {
  message: string;
  notesContext: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface TutorResponseBody {
  reply: string;
  groundedInNotes: boolean;
  citations: string[];
}

export interface TopicScoreInput {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
  isWeak: boolean;
}

export interface StudyPlanRequestBody {
  weakTopics: TopicScoreInput[];
  strongTopics: TopicScoreInput[];
  targetExamDate: string;
  dailyAvailableMinutes: number;
  studyNotesSnippet?: string;
}

export interface StudyTaskOutput {
  topic: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedMinutes: number;
  recommendedActivity: string;
}

export interface StudyPlanResponseBody {
  overallDiagnosis: string;
  tasks: StudyTaskOutput[];
}
