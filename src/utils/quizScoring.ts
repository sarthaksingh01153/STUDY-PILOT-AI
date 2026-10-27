/**
 * Deterministic quiz scoring and topic accuracy analysis.
 * Important: Scoring is calculated purely in application logic and never delegated to the LLM.
 */

import { Quiz, QuizResult, TopicScore, QuizDetailedAnswer } from '../types';

/** Threshold below which a topic is classified as weak (60%) */
export const WEAK_TOPIC_ACCURACY_THRESHOLD = 60;

/**
 * Evaluates a user's quiz submission against the source quiz.
 *
 * @param quiz The quiz being answered
 * @param userAnswers Map of question index to user's selected option index
 * @returns Deterministic QuizResult with score, topic accuracy, and weak/strong lists
 */
export function calculateQuizResult(
  quiz: Quiz,
  userAnswers: Record<number, number>
): QuizResult {
  const totalQuestions = quiz.questions.length;
  let correctCount = 0;

  // Track per-topic performance
  const topicStats: Record<string, { total: number; correct: number }> = {};
  const detailedAnswers: QuizDetailedAnswer[] = [];

  quiz.questions.forEach((q, index) => {
    const selectedOption = userAnswers[index] ?? -1;
    const isCorrect = selectedOption === q.correctIndex;

    if (isCorrect) {
      correctCount += 1;
    }

    // Initialize topic tracker if not present
    const topicName = q.topic ? q.topic.trim() : 'General';
    if (!topicStats[topicName]) {
      topicStats[topicName] = { total: 0, correct: 0 };
    }
    topicStats[topicName].total += 1;
    if (isCorrect) {
      topicStats[topicName].correct += 1;
    }

    detailedAnswers.push({
      questionIndex: index,
      question: q.question,
      topic: topicName,
      selectedOption,
      correctOption: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
    });
  });

  const scorePercentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Compute accuracy and weak/strong classification per topic
  const topicBreakdown: Record<string, TopicScore> = {};
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];

  for (const [topic, stats] of Object.entries(topicStats)) {
    const accuracy =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    const isWeak = accuracy < WEAK_TOPIC_ACCURACY_THRESHOLD;

    topicBreakdown[topic] = {
      topic,
      total: stats.total,
      correct: stats.correct,
      accuracy,
      isWeak,
    };

    if (isWeak) {
      weakTopics.push(topic);
    } else {
      strongTopics.push(topic);
    }
  }

  return {
    id: `result-${Date.now()}`,
    quizId: quiz.id,
    quizTitle: quiz.title,
    totalQuestions,
    correctCount,
    scorePercentage,
    completedAt: new Date().toISOString(),
    topicBreakdown,
    weakTopics,
    strongTopics,
    detailedAnswers,
  };
}
