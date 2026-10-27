import { describe, it, expect } from 'vitest';
import { calculateQuizResult, WEAK_TOPIC_ACCURACY_THRESHOLD } from './quizScoring';
import { Quiz } from '../types';

describe('Deterministic Quiz Scoring and Weak-Topic Detection', () => {
  const sampleQuiz: Quiz = {
    id: 'quiz-unit-test',
    title: 'Computer Science Diagnostic',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        question: 'What is a TLB miss penalty?',
        options: ['Page walk', 'Context switch', 'Disk read', 'Segfault'],
        correctIndex: 0,
        explanation: 'A TLB miss triggers a page table walk to resolve the address.',
        topic: 'Memory Hierarchy',
      },
      {
        id: 'q2',
        question: 'Which is a stack replacement algorithm?',
        options: ['FIFO', 'LRU', 'Clock', 'Random'],
        correctIndex: 1,
        explanation: 'LRU is a stack algorithm and does not suffer from Belady anomaly.',
        topic: 'Page Replacement',
      },
      {
        id: 'q3',
        question: 'Which algorithm suffers from Belady anomaly?',
        options: ['LRU', 'FIFO', 'Optimal', 'LFU'],
        correctIndex: 1,
        explanation: 'FIFO can show increased page faults with more frames.',
        topic: 'Page Replacement',
      },
      {
        id: 'q4',
        question: 'What causes thrashing?',
        options: ['Working set exceeds frames', 'CPU cache miss', 'TLB hit', 'Deadlock'],
        correctIndex: 0,
        explanation: 'Thrashing occurs when memory cannot hold active working sets.',
        topic: 'Thrashing',
      },
    ],
  };

  it('correctly calculates 100% score when all questions answered correctly', () => {
    const userAnswers = { 0: 0, 1: 1, 2: 1, 3: 0 };
    const result = calculateQuizResult(sampleQuiz, userAnswers);

    expect(result.totalQuestions).toBe(4);
    expect(result.correctCount).toBe(4);
    expect(result.scorePercentage).toBe(100);
    expect(result.weakTopics).toHaveLength(0);
    expect(result.strongTopics).toContain('Memory Hierarchy');
    expect(result.strongTopics).toContain('Page Replacement');
    expect(result.strongTopics).toContain('Thrashing');
  });

  it('correctly classifies a topic scoring under 60% as weak', () => {
    // Answer Q1 correctly (Memory Hierarchy: 1/1 = 100%)
    // Answer Q2 correctly, Q3 wrong (Page Replacement: 1/2 = 50% -> < 60% -> WEAK!)
    // Answer Q4 wrong (Thrashing: 0/1 = 0% -> < 60% -> WEAK!)
    const userAnswers = { 0: 0, 1: 1, 2: 0, 3: 1 };
    const result = calculateQuizResult(sampleQuiz, userAnswers);

    expect(result.correctCount).toBe(2);
    expect(result.scorePercentage).toBe(50);

    // Page Replacement accuracy is 50%, below 60% threshold
    expect(result.topicBreakdown['Page Replacement'].accuracy).toBe(50);
    expect(result.topicBreakdown['Page Replacement'].isWeak).toBe(true);
    expect(result.weakTopics).toContain('Page Replacement');

    // Thrashing accuracy is 0%, below 60% threshold
    expect(result.topicBreakdown['Thrashing'].accuracy).toBe(0);
    expect(result.topicBreakdown['Thrashing'].isWeak).toBe(true);
    expect(result.weakTopics).toContain('Thrashing');

    // Memory Hierarchy accuracy is 100%, strong
    expect(result.topicBreakdown['Memory Hierarchy'].accuracy).toBe(100);
    expect(result.topicBreakdown['Memory Hierarchy'].isWeak).toBe(false);
    expect(result.strongTopics).toContain('Memory Hierarchy');
  });

  it('never uses random or non-deterministic calculations', () => {
    const userAnswers = { 0: 3, 1: 3, 2: 3, 3: 3 };
    const result1 = calculateQuizResult(sampleQuiz, userAnswers);
    const result2 = calculateQuizResult(sampleQuiz, userAnswers);

    expect(result1.scorePercentage).toBe(result2.scorePercentage);
    expect(result1.weakTopics).toEqual(result2.weakTopics);
    expect(result1.correctCount).toBe(0);
    expect(result1.scorePercentage).toBe(0);
  });

  it('uses exactly 60% as the weak-topic boundary threshold', () => {
    expect(WEAK_TOPIC_ACCURACY_THRESHOLD).toBe(60);
  });
});
