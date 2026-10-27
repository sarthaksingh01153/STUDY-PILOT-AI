/**
 * Topic performance aggregation across multiple quizzes.
 */

import { QuizResult, TopicScore } from '../types';
import { WEAK_TOPIC_ACCURACY_THRESHOLD } from './quizScoring';

/**
 * Aggregates all completed quiz results into a unified topic mastery profile.
 */
export function aggregateTopicMastery(
  results: QuizResult[]
): Record<string, TopicScore> {
  const aggregated: Record<string, { total: number; correct: number }> = {};

  results.forEach((res) => {
    Object.values(res.topicBreakdown).forEach((t) => {
      if (!aggregated[t.topic]) {
        aggregated[t.topic] = { total: 0, correct: 0 };
      }
      aggregated[t.topic].total += t.total;
      aggregated[t.topic].correct += t.correct;
    });
  });

  const finalBreakdown: Record<string, TopicScore> = {};

  for (const [topic, stats] of Object.entries(aggregated)) {
    const accuracy =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    finalBreakdown[topic] = {
      topic,
      total: stats.total,
      correct: stats.correct,
      accuracy,
      isWeak: accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD,
    };
  }

  return finalBreakdown;
}

/**
 * Calculates overall study stats from all completed quizzes.
 */
export function calculateOverallStats(results: QuizResult[]) {
  if (results.length === 0) {
    return {
      totalQuizzesTaken: 0,
      totalQuestionsAnswered: 0,
      overallAverageScore: 0,
      weakTopicCount: 0,
      strongTopicCount: 0,
    };
  }

  const totalQuestions = results.reduce((acc, r) => acc + r.totalQuestions, 0);
  const totalCorrect = results.reduce((acc, r) => acc + r.correctCount, 0);
  const overallAverageScore =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const topicMap = aggregateTopicMastery(results);
  const weakTopicCount = Object.values(topicMap).filter((t) => t.isWeak).length;
  const strongTopicCount = Object.values(topicMap).filter((t) => !t.isWeak).length;

  return {
    totalQuizzesTaken: results.length,
    totalQuestionsAnswered: totalQuestions,
    overallAverageScore,
    weakTopicCount,
    strongTopicCount,
  };
}
