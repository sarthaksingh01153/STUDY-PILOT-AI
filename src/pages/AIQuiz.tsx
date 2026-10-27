import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  CalendarCheck,
  Award,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { LoadingState } from '../components/LoadingState';
import { ErrorMessage } from '../components/ErrorMessage';
import { NoteSummary, Quiz, QuizResult } from '../types';
import { api } from '../services/api';
import { quizService } from '../services/quizService';
import { calculateQuizResult } from '../utils/quizScoring';
import { NavigationPage } from '../components/GlassSidebar';

interface AIQuizProps {
  notes: NoteSummary[];
  activeQuizNote: NoteSummary | null;
  onNavigate: (page: NavigationPage) => void;
  onQuizCompleted: (result: QuizResult) => void;
}

export const AIQuiz: React.FC<AIQuizProps> = ({
  notes,
  activeQuizNote,
  onNavigate,
  onQuizCompleted,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    activeQuizNote?.id || (notes[0]?.id ?? '')
  );
  const [questionCount, setQuestionCount] = useState<number>(5);

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuiz = async () => {
    const note = notes.find((n) => n.id === selectedNoteId);
    if (!note && notes.length > 0) {
      setError('Please select a study note to generate the quiz from.');
      return;
    }

    const textToUse = note ? `${note.title}\n\n${note.summary}\n\n${note.rawText}` : '';
    if (!textToUse.trim()) {
      setError('No study notes available. Please upload a PDF or enter notes in AI Notes first.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setQuizResult(null);
    setUserAnswers({});

    try {
      const response = await api.generateQuiz({ text: textToUse, questionCount });

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: response.title || `${note?.title || 'Study'} Quiz`,
        createdAt: new Date().toISOString(),
        sourceNoteId: note?.id,
        questions: response.questions,
      };

      quizService.saveQuiz(newQuiz);
      setActiveQuiz(newQuiz);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Quiz generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (quizResult) return; // Lock after submission
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;

    const unansweredCount = activeQuiz.questions.length - Object.keys(userAnswers).length;
    if (unansweredCount > 0) {
      const ok = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Submit anyway?`
      );
      if (!ok) return;
    }

    const result = calculateQuizResult(activeQuiz, userAnswers);
    quizService.saveResult(result);
    setQuizResult(result);
    onQuizCompleted(result);

    if (result.scorePercentage >= 80) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleRetake = () => {
    setUserAnswers({});
    setQuizResult(null);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestions = activeQuiz?.questions.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">AI Quiz Generator &amp; Assessment</h1>
        <p className="page-subtitle">
          Test your mastery with concept-driven MCQs. Scores and topic breakdowns are calculated
          deterministically.
        </p>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {/* Generator Configuration */}
      {!activeQuiz && !isGenerating && (
        <GlassCard
          title="Create Practice Quiz"
          subtitle="Select your notes and configure question parameters."
        >
          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px' }}>
              <BookOpen
                size={36}
                style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }}
                aria-hidden="true"
              />
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                You haven't uploaded any study notes yet.
              </p>
              <GlassButton
                variant="primary"
                onClick={() => onNavigate('notes')}
                icon={<BookOpen size={15} />}
              >
                Go to AI Notes
              </GlassButton>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '560px' }}>
              {/* Source note selector */}
              <div className="glass-input-wrapper">
                <label htmlFor="quiz-source-note" className="glass-label">
                  Source Study Material
                </label>
                <select
                  id="quiz-source-note"
                  className="glass-select"
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                  aria-label="Select source study material for quiz"
                >
                  {notes.map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title} ({note.wordCount.toLocaleString()} words)
                    </option>
                  ))}
                </select>
              </div>

              {/* Question count selector */}
              <div className="glass-input-wrapper">
                <span className="glass-label" id="question-count-label">
                  Number of Questions
                </span>
                <div
                  style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
                  role="group"
                  aria-labelledby="question-count-label"
                >
                  {[3, 5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`count-pill ${questionCount === num ? 'active' : ''}`}
                      onClick={() => setQuestionCount(num)}
                      aria-pressed={questionCount === num}
                      aria-label={`${num} questions`}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <GlassButton
                  variant="primary"
                  onClick={handleGenerateQuiz}
                  isLoading={isGenerating}
                  icon={<Sparkles size={15} />}
                >
                  Generate Quiz with Gemini
                </GlassButton>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Loading state */}
      {isGenerating && (
        <LoadingState
          title="Synthesizing Multiple-Choice Questions…"
          description="Formulating conceptual questions, balanced answer choices, and thorough explanations from your notes."
        />
      )}

      {/* Active Quiz View */}
      {activeQuiz && !isGenerating && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quiz Action Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {activeQuiz.title}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {activeQuiz.questions.length} questions · Answer all and submit to score
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <GlassButton
                variant="secondary"
                onClick={() => {
                  setActiveQuiz(null);
                  setQuizResult(null);
                  setUserAnswers({});
                }}
                style={{ fontSize: '0.875rem' }}
              >
                New Quiz
              </GlassButton>
              {quizResult && (
                <GlassButton
                  variant="ghost"
                  onClick={handleRetake}
                  icon={<RotateCcw size={14} />}
                  style={{ fontSize: '0.875rem' }}
                >
                  Retake
                </GlassButton>
              )}
            </div>
          </div>

          {/* Results Summary Card */}
          {quizResult && (
            <GlassCard
              style={{
                background:
                  quizResult.scorePercentage >= 60
                    ? 'linear-gradient(135deg, rgba(52, 199, 89, 0.06), #FFFFFF)'
                    : 'linear-gradient(135deg, rgba(255, 59, 48, 0.06), #FFFFFF)',
                border:
                  quizResult.scorePercentage >= 60
                    ? '1.5px solid rgba(52, 199, 89, 0.28)'
                    : '1.5px solid rgba(255, 59, 48, 0.28)',
              }}
              role="region"
              aria-label="Quiz results summary"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  {/* Score Circle */}
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      background:
                        quizResult.scorePercentage >= 60
                          ? 'rgba(52, 199, 89, 0.10)'
                          : 'rgba(255, 59, 48, 0.10)',
                      border: `2.5px solid ${
                        quizResult.scorePercentage >= 60
                          ? 'var(--accent-emerald)'
                          : 'var(--accent-rose)'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: quizResult.scorePercentage >= 60 ? '#166534' : '#991B1B',
                      letterSpacing: '-0.02em',
                      flexShrink: 0,
                    }}
                    role="img"
                    aria-label={`Score: ${quizResult.scorePercentage}%`}
                  >
                    {quizResult.scorePercentage}%
                  </div>

                  <div>
                    <h2
                      style={{
                        fontSize: '1.1875rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {quizResult.scorePercentage >= 80
                        ? 'Mastery Demonstrated! 🎉'
                        : quizResult.scorePercentage >= 60
                        ? 'Solid Understanding 👍'
                        : 'Focused Revision Recommended ⚠️'}
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      You scored {quizResult.correctCount} of {quizResult.totalQuestions} questions correctly.
                    </p>
                  </div>
                </div>

                {quizResult.weakTopics.length > 0 && (
                  <GlassButton
                    variant="primary"
                    onClick={() => onNavigate('planner')}
                    icon={<CalendarCheck size={15} />}
                  >
                    Schedule Revision
                  </GlassButton>
                )}
              </div>

              {/* Topic Breakdown */}
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--glass-border)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Topic Accuracy Analysis:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.values(quizResult.topicBreakdown).map((t) => (
                    <div
                      key={t.topic}
                      style={{
                        padding: '6px 13px',
                        borderRadius: 'var(--radius-md)',
                        background: t.isWeak ? 'var(--color-error-subtle)' : 'var(--color-success-subtle)',
                        border: `1.5px solid ${t.isWeak ? 'var(--color-error-border)' : 'var(--color-success-border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                      }}
                      role="status"
                      aria-label={`${t.topic}: ${t.accuracy}%, ${t.isWeak ? 'weak topic' : 'strong topic'}`}
                    >
                      <span
                        style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}
                      >
                        {t.topic}:
                      </span>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: t.isWeak ? 'var(--color-error)' : 'var(--accent-emerald-dark)',
                        }}
                      >
                        {t.accuracy}% ({t.correct}/{t.total})
                      </span>
                      {t.isWeak && (
                        <span
                          className="glass-badge glass-badge-rose"
                          style={{ fontSize: '0.6875rem' }}
                          aria-hidden="true"
                        >
                          Weak
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Question List */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            role="list"
            aria-label="Quiz questions"
          >
            {activeQuiz.questions.map((q, qIndex) => {
              const selectedOpt = userAnswers[qIndex];
              const isSubmitted = Boolean(quizResult);
              const detailed = quizResult?.detailedAnswers[qIndex];

              return (
                <GlassCard key={q.id} style={{ position: 'relative' }} role="listitem">
                  {/* Question Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flex: 1 }}>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: 'var(--accent-blue)',
                          background: 'var(--accent-blue-subtle)',
                          padding: '2px 9px',
                          borderRadius: 'var(--radius-xs)',
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      >
                        Q{qIndex + 1}
                      </span>
                      <h3
                        style={{
                          fontSize: '1.0625rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          lineHeight: 1.4,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {q.question}
                      </h3>
                    </div>

                    <span
                      className="glass-badge glass-badge-blue"
                      style={{ fontSize: '0.75rem', flexShrink: 0 }}
                    >
                      {q.topic}
                    </span>
                  </div>

                  {/* Options Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '10px',
                    }}
                    role="radiogroup"
                    aria-label={`Options for question ${qIndex + 1}`}
                  >
                    {q.options.map((opt, optIndex) => {
                      const isSelected = selectedOpt === optIndex;
                      const isCorrect = q.correctIndex === optIndex;

                      let borderColor = 'var(--glass-border)';
                      let bgColor = '#FFFFFF';
                      let textColor = 'var(--text-primary)';
                      let ariaLabel = opt;

                      if (isSubmitted) {
                        if (isCorrect) {
                          borderColor = 'rgba(52, 199, 89, 0.45)';
                          bgColor = '#F0FDF4';
                          textColor = '#166534';
                          ariaLabel += ' (correct answer)';
                        } else if (isSelected && !isCorrect) {
                          borderColor = 'rgba(255, 59, 48, 0.45)';
                          bgColor = 'var(--color-error-subtle)';
                          textColor = '#991B1B';
                          ariaLabel += ' (your answer — incorrect)';
                        }
                      } else if (isSelected) {
                        borderColor = 'var(--accent-blue)';
                        bgColor = 'var(--accent-blue-subtle)';
                        textColor = 'var(--accent-blue)';
                        ariaLabel += ' (selected)';
                      }

                      return (
                        <div
                          key={optIndex}
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={ariaLabel}
                          tabIndex={isSubmitted ? -1 : 0}
                          onClick={() => handleSelectOption(qIndex, optIndex)}
                          onKeyDown={(e) => {
                            if (!isSubmitted && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              handleSelectOption(qIndex, optIndex);
                            }
                          }}
                          style={{
                            padding: '13px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${borderColor}`,
                            background: bgColor,
                            cursor: isSubmitted ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            boxShadow: isSelected && !isSubmitted
                              ? '0 1px 6px rgba(0, 122, 255, 0.16)'
                              : 'var(--glass-shadow-sm)',
                            transition: 'all var(--transition-fast)',
                            outline: 'none',
                          }}
                          onFocus={(e) => {
                            if (!isSubmitted && !isSelected) {
                              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.20)';
                            }
                          }}
                          onBlur={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--glass-border)';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: isSelected
                                  ? isSubmitted
                                    ? isCorrect
                                      ? 'var(--accent-emerald-dark)'
                                      : 'var(--color-error)'
                                    : 'var(--accent-blue)'
                                  : '#F0F1F3',
                                color: isSelected ? '#FFFFFF' : 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                flexShrink: 0,
                                transition: 'all var(--transition-fast)',
                              }}
                              aria-hidden="true"
                            >
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span
                              style={{
                                fontSize: '0.9375rem',
                                color: textColor,
                                fontWeight: isSelected ? 600 : 400,
                                lineHeight: 1.45,
                                wordBreak: 'break-word',
                              }}
                            >
                              {opt}
                            </span>
                          </div>

                          {isSubmitted && isCorrect && (
                            <CheckCircle2
                              size={17}
                              style={{ color: 'var(--accent-emerald-dark)', flexShrink: 0 }}
                              aria-hidden="true"
                            />
                          )}
                          {isSubmitted && isSelected && !isCorrect && (
                            <XCircle
                              size={17}
                              style={{ color: 'var(--accent-rose)', flexShrink: 0 }}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation post-submit */}
                  {isSubmitted && detailed && (
                    <div
                      role="region"
                      aria-label="Answer explanation"
                      style={{
                        marginTop: '14px',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: detailed.isCorrect
                          ? 'var(--color-success-subtle)'
                          : 'var(--color-error-subtle)',
                        border: `1.5px solid ${
                          detailed.isCorrect
                            ? 'var(--color-success-border)'
                            : 'var(--color-error-border)'
                        }`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: detailed.isCorrect ? '#166534' : '#991B1B',
                          marginBottom: '4px',
                        }}
                      >
                        {detailed.isCorrect ? '✓ Correct!' : '✗ Incorrect.'} Explanation:
                      </div>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>

          {/* Sticky Submit Bar */}
          {!quizResult && (
            <div className="quiz-submit-bar">
              <div>
                <span
                  style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', fontWeight: 500 }}
                  aria-live="polite"
                  aria-label={`${answeredCount} of ${totalQuestions} questions answered`}
                >
                  {answeredCount} of {totalQuestions} answered
                </span>
                {/* Inline progress indicator */}
                <div
                  className="progress-track"
                  style={{ marginTop: '6px', width: '160px' }}
                  role="progressbar"
                  aria-valuenow={answeredCount}
                  aria-valuemin={0}
                  aria-valuemax={totalQuestions}
                  aria-label="Quiz completion progress"
                >
                  <div
                    className="progress-fill progress-fill-blue"
                    style={{
                      width: totalQuestions > 0 ? `${(answeredCount / totalQuestions) * 100}%` : '0%',
                    }}
                  />
                </div>
              </div>

              <GlassButton
                variant="primary"
                onClick={handleSubmitQuiz}
                icon={<Award size={15} />}
                aria-label="Submit quiz and calculate score"
              >
                Submit &amp; Calculate Score
              </GlassButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
