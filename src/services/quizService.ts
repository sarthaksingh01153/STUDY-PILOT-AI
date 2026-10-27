/**
 * Quiz Service
 * Handles saving generated quizzes and completed quiz attempt results in browser local storage.
 */

import { Quiz, QuizResult } from '../types';

const QUIZZES_STORAGE_KEY = 'studypilot_quizzes';
const RESULTS_STORAGE_KEY = 'studypilot_quiz_results';

export const quizService = {
  /**
   * Retrieves all generated quizzes.
   */
  getQuizzes(): Quiz[] {
    try {
      const data = localStorage.getItem(QUIZZES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Saves a newly generated quiz.
   */
  saveQuiz(quiz: Quiz): Quiz[] {
    const list = this.getQuizzes();
    const updated = [quiz, ...list.filter((q) => q.id !== quiz.id)];
    localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  /**
   * Retrieves all completed quiz results.
   */
  getResults(): QuizResult[] {
    try {
      const data = localStorage.getItem(RESULTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Saves a newly scored quiz result.
   */
  saveResult(result: QuizResult): QuizResult[] {
    const list = this.getResults();
    const updated = [result, ...list];
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  /**
   * Clears quiz history (useful for testing and reset demo).
   */
  clearResults(): void {
    localStorage.removeItem(RESULTS_STORAGE_KEY);
  },
};
