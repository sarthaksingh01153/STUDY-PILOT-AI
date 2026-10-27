import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CalendarCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  BookOpen,
  Calendar,
  CheckSquare,
  Square,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { LoadingState } from '../components/LoadingState';
import { ErrorMessage } from '../components/ErrorMessage';
import { QuizResult, StudyPlan, TopicScore } from '../types';
import { api } from '../services/api';
import { studyPlanService } from '../services/studyPlanService';
import { formatMinutes, formatDate, daysUntil } from '../utils/formatTime';
import { NavigationPage } from '../components/GlassSidebar';

interface StudyPlannerProps {
  quizResults: QuizResult[];
  activePlan: StudyPlan | null;
  onPlanUpdated: (plan: StudyPlan | null) => void;
  examDate: string;
  onSetExamDate: (date: string) => void;
  onNavigate: (page: NavigationPage) => void;
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'glass-badge-rose',
  medium: 'glass-badge-amber',
  low: 'glass-badge-indigo',
};

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
  quizResults,
  activePlan,
  onPlanUpdated,
  examDate,
  onSetExamDate,
  onNavigate,
}) => {
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aggregate topic stats from quiz attempts
  const topicMap: Record<string, { total: number; correct: number }> = {};
  quizResults.forEach((res) => {
    Object.values(res.topicBreakdown).forEach((t) => {
      if (!topicMap[t.topic]) topicMap[t.topic] = { total: 0, correct: 0 };
      topicMap[t.topic].total += t.total;
      topicMap[t.topic].correct += t.correct;
    });
  });

  const allTopics: TopicScore[] = Object.entries(topicMap).map(([topic, stats]) => {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return {
      topic,
      total: stats.total,
      correct: stats.correct,
      accuracy,
      isWeak: accuracy < 60,
    };
  });

  const weakTopics = allTopics.filter((t) => t.isWeak);
  const strongTopics = allTopics.filter((t) => !t.isWeak);

  const handleGeneratePlan = async () => {
    if (quizResults.length === 0) {
      setError('Please complete at least one quiz so StudyPilot can diagnose your topic performance.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await api.generateStudyPlan({
        weakTopics,
        strongTopics,
        targetExamDate: examDate,
        dailyAvailableMinutes: dailyMinutes,
      });

      const newPlan: StudyPlan = {
        id: `plan-${Date.now()}`,
        createdAt: new Date().toISOString(),
        targetExamDate: examDate,
        dailyAvailableMinutes: dailyMinutes,
        overallDiagnosis: response.overallDiagnosis,
        weakTopicsIdentified: weakTopics.map((w) => w.topic),
        tasks: response.tasks.map((task, idx) => ({
          ...task,
          id: `task-${Date.now()}-${idx + 1}`,
          completed: false,
        })),
      };

      studyPlanService.savePlan(newPlan);
      onPlanUpdated(newPlan);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate study schedule.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const updated = studyPlanService.toggleTask(taskId);
    onPlanUpdated(updated);

    if (updated) {
      const allDone = updated.tasks.length > 0 && updated.tasks.every((t) => t.completed);
      if (allDone) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      }
    }
  };

  const completedCount = activePlan?.tasks.filter((t) => t.completed).length ?? 0;
  const totalTasks = activePlan?.tasks.length ?? 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const daysLeft = daysUntil(examDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="page-title">AI Study Agent &amp; Adaptive Planner</h1>
          <p className="page-subtitle">
            Autonomous agent that targets your weak topics (&lt;60% accuracy) and drafts a
            realistic revision schedule.
          </p>
        </div>

        {activePlan && (
          <GlassButton
            variant="secondary"
            onClick={handleGeneratePlan}
            isLoading={isGenerating}
            icon={<RotateCcw size={14} />}
          >
            Regenerate
          </GlassButton>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {/* Constraints & Diagnosis Row */}
      <div className="grid-3">
        {/* Exam Date Card */}
        <GlassCard title="Target Exam Date" subtitle="Deadline for your study milestones.">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-blue-subtle)',
                border: '1.5px solid var(--accent-blue-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <Calendar size={20} />
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <div
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
                aria-live="polite"
              >
                {daysLeft > 0 ? `${daysLeft} days until exam` : 'Target date reached'}
              </div>
              <div style={{ marginTop: '6px' }}>
                <label
                  htmlFor="planner-exam-date"
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  Change date
                </label>
                <input
                  id="planner-exam-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => onSetExamDate(e.target.value)}
                  className="glass-input"
                  style={{ padding: '6px 10px', fontSize: '0.875rem', width: 'auto' }}
                  aria-label="Target exam date"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Daily Study Time */}
        <GlassCard title="Daily Study Time" subtitle="Allocate realistic focus time per day.">
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                Available daily:
              </span>
              <span
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 800,
                  color: 'var(--accent-blue)',
                  letterSpacing: '-0.02em',
                }}
                aria-live="polite"
                aria-label={`Daily study time: ${formatMinutes(dailyMinutes)}`}
              >
                {formatMinutes(dailyMinutes)}
              </span>
            </div>
            <label htmlFor="daily-minutes-range" className="sr-only">
              Daily study minutes: {dailyMinutes}
            </label>
            <input
              id="daily-minutes-range"
              type="range"
              min={15}
              max={240}
              step={15}
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              aria-valuemin={15}
              aria-valuemax={240}
              aria-valuenow={dailyMinutes}
              aria-label={`Daily study time: ${formatMinutes(dailyMinutes)}`}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '5px',
              }}
              aria-hidden="true"
            >
              <span>15m</span>
              <span>1h</span>
              <span>2h</span>
              <span>4h</span>
            </div>
          </div>
        </GlassCard>

        {/* Weak Topic Diagnosis */}
        <GlassCard title="Performance Diagnosis" subtitle="Derived from your quiz attempts.">
          <div style={{ marginTop: '8px' }}>
            {quizResults.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                No quiz results yet. Complete a quiz to identify weak areas.
              </p>
            ) : weakTopics.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2
                  size={17}
                  style={{ color: 'var(--accent-emerald-dark)' }}
                  aria-hidden="true"
                />
                <span
                  style={{ fontSize: '0.9rem', color: 'var(--accent-emerald-dark)', fontWeight: 600 }}
                  role="status"
                >
                  All topics ≥ 60% accuracy!
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span
                  style={{ fontSize: '0.875rem', color: 'var(--color-error)', fontWeight: 600 }}
                  role="status"
                  aria-live="polite"
                >
                  {weakTopics.length} topic{weakTopics.length !== 1 ? 's' : ''} scoring &lt; 60%:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {weakTopics.map((w) => (
                    <span key={w.topic} className="glass-badge glass-badge-rose">
                      {w.topic} ({w.accuracy}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Main Study Plan Content */}
      {isGenerating ? (
        <LoadingState
          title="AI Study Agent is formulating your revision roadmap…"
          description="Synthesizing weak topics, prioritizing high-yield concepts, and breaking work into digestible study sessions."
        />
      ) : activePlan ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Plan Header & Progress */}
          <GlassCard>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ maxWidth: '680px', flex: 1 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <span className="glass-badge glass-badge-blue">Agent Timetable</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Created {formatDate(activePlan.createdAt)}
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: '1.1875rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Agent Diagnosis &amp; Strategy
                </h2>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: 'var(--text-secondary)',
                    marginTop: '6px',
                    lineHeight: 1.6,
                  }}
                >
                  {activePlan.overallDiagnosis}
                </p>
              </div>

              {/* Progress Display */}
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}
                role="status"
                aria-label={`Study plan progress: ${progressPercent}%, ${completedCount} of ${totalTasks} tasks complete`}
              >
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {progressPercent}%
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {completedCount} of {totalTasks} tasks
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className="progress-track"
              style={{ marginTop: '20px', height: '8px' }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall completion: ${progressPercent}%`}
            >
              <div
                className="progress-fill progress-fill-gradient"
                style={{ width: `${progressPercent}%`, transition: 'width 0.5s var(--ease-spring)' }}
              />
            </div>
          </GlassCard>

          {/* Revision Tasks Checklist */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <h2
                style={{
                  fontSize: '1.1875rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Personalized Revision Roadmap
              </h2>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Click tasks to mark complete
              </span>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
              role="list"
              aria-label="Revision tasks checklist"
            >
              {activePlan.tasks.map((task) => (
                <div
                  key={task.id}
                  role="listitem"
                  onClick={() => handleToggleTask(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleTask(task.id);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`${task.topic}: ${task.completed ? 'completed' : 'incomplete'}`}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 'var(--radius-lg)',
                    background: task.completed ? '#F0FDF4' : '#FFFFFF',
                    border: `1.5px solid ${
                      task.completed ? 'rgba(52, 199, 89, 0.32)' : 'var(--glass-border)'
                    }`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    transition: 'all var(--transition-fast)',
                    opacity: task.completed ? 0.72 : 1,
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--focus-ring)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      marginTop: '1px',
                      color: task.completed ? 'var(--accent-emerald-dark)' : 'var(--text-muted)',
                      flexShrink: 0,
                      transition: 'color var(--transition-fast)',
                    }}
                    aria-hidden="true"
                  >
                    {task.completed ? (
                      <CheckSquare size={22} />
                    ) : (
                      <Square size={22} />
                    )}
                  </div>

                  {/* Task Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                            textDecoration: task.completed ? 'line-through' : 'none',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {task.topic}
                        </span>
                        <span
                          className={`glass-badge ${PRIORITY_BADGE[task.priority] || 'glass-badge-indigo'}`}
                        >
                          {task.priority} priority
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: 'var(--text-muted)',
                          fontSize: '0.875rem',
                          flexShrink: 0,
                        }}
                        aria-label={`Estimated time: ${formatMinutes(task.estimatedMinutes)}`}
                      >
                        <Clock size={14} aria-hidden="true" />
                        <span>{formatMinutes(task.estimatedMinutes)}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        Activity:{' '}
                      </strong>
                      {task.recommendedActivity}
                    </p>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.45 }}>
                      <strong style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                        Reason:{' '}
                      </strong>
                      {task.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <GlassCard style={{ textAlign: 'center', padding: '60px 24px' }}>
          <CalendarCheck
            size={48}
            style={{ color: 'var(--accent-blue)', margin: '0 auto 16px', opacity: 0.85 }}
            aria-hidden="true"
          />
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            No Active Study Plan Yet
          </h2>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--text-secondary)',
              marginTop: '8px',
              maxWidth: '480px',
              margin: '8px auto 0',
              lineHeight: 1.6,
            }}
          >
            {quizResults.length > 0
              ? 'You have completed quiz attempts! StudyPilot AI is ready to synthesize your weak topics into an adaptive revision timetable.'
              : 'Complete a quiz first so StudyPilot can diagnose your topic strengths and weaknesses.'}
          </p>

          <div style={{ marginTop: '24px' }}>
            {quizResults.length > 0 ? (
              <GlassButton
                variant="primary"
                onClick={handleGeneratePlan}
                isLoading={isGenerating}
                icon={<Sparkles size={15} />}
              >
                Generate Personalized Study Plan
              </GlassButton>
            ) : (
              <GlassButton
                variant="primary"
                onClick={() => onNavigate('quiz')}
                icon={<BookOpen size={15} />}
              >
                Go to AI Quiz
              </GlassButton>
            )}
          </div>
        </GlassCard>
      )}

      {/* sr-only utility */}
      <style>{`.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}`}</style>
    </div>
  );
};
