import React from 'react';
import {
  FileText,
  HelpCircle,
  CalendarCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { NoteSummary, QuizResult, TopicScore } from '../types';
import { NavigationPage } from '../components/GlassSidebar';
import { formatDate, daysUntil } from '../utils/formatTime';

interface DashboardProps {
  notes: NoteSummary[];
  results: QuizResult[];
  onNavigate: (page: NavigationPage) => void;
  examDate: string;
  onSetExamDate: (date: string) => void;
  onLoadSampleData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  notes,
  results,
  onNavigate,
  examDate,
  onSetExamDate,
  onLoadSampleData,
}) => {
  // Aggregate stats across quizzes
  const totalQuestionsAnswered = results.reduce((acc, r) => acc + r.totalQuestions, 0);
  const totalCorrect = results.reduce((acc, r) => acc + r.correctCount, 0);
  const averageScore =
    totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;

  // Aggregate topics
  const topicMap: Record<string, { total: number; correct: number }> = {};
  results.forEach((res) => {
    Object.values(res.topicBreakdown).forEach((t) => {
      if (!topicMap[t.topic]) topicMap[t.topic] = { total: 0, correct: 0 };
      topicMap[t.topic].total += t.total;
      topicMap[t.topic].correct += t.correct;
    });
  });

  const topicList: TopicScore[] = Object.entries(topicMap).map(([topic, stats]) => {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return {
      topic,
      total: stats.total,
      correct: stats.correct,
      accuracy,
      isWeak: accuracy < 60,
    };
  });

  const weakTopics = topicList.filter((t) => t.isWeak);
  const daysLeft = daysUntil(examDate);

  const statsCards = [
    {
      label: 'Notes Summarized',
      value: notes.length,
      sub: notes.length > 0
        ? `${notes.reduce((acc, n) => acc + n.wordCount, 0).toLocaleString()} total words`
        : 'No notes added yet',
      icon: <FileText size={18} aria-hidden="true" />,
      iconColor: 'var(--accent-blue)',
    },
    {
      label: 'Quizzes Completed',
      value: results.length,
      sub: `${totalQuestionsAnswered} questions attempted`,
      icon: <HelpCircle size={18} aria-hidden="true" />,
      iconColor: 'var(--accent-indigo)',
    },
    {
      label: 'Accuracy Average',
      value: totalQuestionsAnswered > 0 ? `${averageScore}%` : '—',
      sub: totalQuestionsAnswered > 0
        ? `${totalCorrect} of ${totalQuestionsAnswered} correct`
        : 'Take a quiz to start',
      icon: (
        <TrendingUp
          size={18}
          aria-hidden="true"
          style={{ color: averageScore >= 60 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}
        />
      ),
      iconColor: averageScore >= 60 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
      glow: (averageScore >= 60 && totalQuestionsAnswered > 0 ? 'emerald' : 'none') as 'emerald' | 'none',
    },
    {
      label: 'Weak Topics (<60%)',
      value: weakTopics.length > 0 ? weakTopics.length : results.length > 0 ? '✓' : '—',
      sub: weakTopics.length > 0 ? 'Targeted by Study Agent' : results.length > 0 ? 'All topics mastered!' : 'Complete a quiz first',
      icon: <AlertCircle size={18} aria-hidden="true" />,
      iconColor: weakTopics.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
      glow: (weakTopics.length > 0 ? 'rose' : 'none') as 'rose' | 'none',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page heading for accessibility (visually becomes the welcome banner) */}
      <h1 className="sr-only">StudyPilot AI Dashboard</h1>

      {/* Welcome Banner */}
      <div className="welcome-banner" role="banner">
        <div style={{ maxWidth: '620px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <span className="glass-badge glass-badge-indigo">
              <Sparkles size={11} aria-hidden="true" />
              AI Study Engine
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              Adaptive Learning
            </span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}
          >
            Welcome back to StudyPilot AI
          </h2>
          <p
            style={{
              marginTop: '8px',
              fontSize: '0.9375rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '520px',
            }}
          >
            Synthesize lecture notes, practice with AI-generated quizzes, and let your
            automated study agent generate a tailored revision schedule based on your weak topics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <GlassButton
            variant="primary"
            onClick={() => onNavigate('notes')}
            icon={<FileText size={15} />}
          >
            Upload Notes
          </GlassButton>
          <GlassButton
            variant="secondary"
            onClick={() => onNavigate('quiz')}
            icon={<HelpCircle size={15} />}
          >
            Take Quiz
          </GlassButton>
        </div>
      </div>

      {/* Stats Metrics Row */}
      <div className="grid-4" role="list" aria-label="Study statistics">
        {statsCards.map((card, i) => (
          <GlassCard key={i} glow={card.glow as 'emerald' | 'rose' | 'none' | undefined}>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              role="listitem"
            >
              <span className="stat-card-label">{card.label}</span>
              <span style={{ color: card.iconColor }}>{card.icon}</span>
            </div>
            <div
              className="stat-card-value"
              style={{ marginTop: '10px' }}
              aria-label={`${card.label}: ${card.value}`}
            >
              {card.value}
            </div>
            <p className="stat-card-sub">{card.sub}</p>
          </GlassCard>
        ))}
      </div>

      {/* Main Split Grid */}
      <div className="grid-2">
        {/* Topic Mastery Progress */}
        <GlassCard
          title="Topic Mastery Breakdown"
          subtitle="Real-time accuracy computed from your quiz attempts."
          action={
            results.length > 0 ? (
              <GlassButton
                variant="ghost"
                onClick={() => onNavigate('quiz')}
                style={{ fontSize: '0.8125rem', padding: '4px 10px' }}
              >
                Retake Quiz
              </GlassButton>
            ) : undefined
          }
        >
          {topicList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px' }}>
              <HelpCircle
                size={32}
                style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }}
                aria-hidden="true"
              />
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                No quiz performance recorded yet.
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Generate and submit a quiz to see topic-level strengths and weaknesses.
              </p>
              <GlassButton
                variant="secondary"
                onClick={() => onNavigate('quiz')}
                style={{ marginTop: '14px' }}
              >
                Go to AI Quiz
              </GlassButton>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topicList.map((t) => (
                <div key={t.topic}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '7px',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '180px',
                        }}
                      >
                        {t.topic}
                      </span>
                      {t.isWeak ? (
                        <span className="glass-badge glass-badge-rose">Needs Revision</span>
                      ) : (
                        <span className="glass-badge glass-badge-emerald">Mastered</span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: t.isWeak ? 'var(--color-error)' : 'var(--accent-emerald-dark)',
                        flexShrink: 0,
                      }}
                      aria-label={`${t.accuracy}% accuracy, ${t.correct} of ${t.total} correct`}
                    >
                      {t.accuracy}% ({t.correct}/{t.total})
                    </span>
                  </div>
                  {/* Accessible progress bar */}
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-valuenow={t.accuracy}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${t.topic} mastery: ${t.accuracy}%`}
                  >
                    <div
                      className={`progress-fill ${t.isWeak ? 'progress-fill-rose' : 'progress-fill-emerald'}`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Exam Countdown & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <GlassCard
            title="Upcoming Target Exam"
            subtitle="Keep your study timetable aligned with your exam schedule."
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginTop: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-blue-subtle)',
                  border: '1.5px solid var(--accent-blue-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                <Clock size={20} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                  aria-live="polite"
                >
                  {daysLeft > 0
                    ? `${daysLeft} Day${daysLeft === 1 ? '' : 's'} Remaining`
                    : 'Exam Date Reached'}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Target: {formatDate(examDate)}
                </div>
              </div>
              <div>
                <label
                  htmlFor="dashboard-exam-date"
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
                  id="dashboard-exam-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => onSetExamDate(e.target.value)}
                  className="glass-input"
                  style={{ padding: '7px 11px', fontSize: '0.875rem', width: 'auto' }}
                  aria-label="Target exam date"
                />
              </div>
            </div>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid var(--glass-border)',
              }}
            >
              <GlassButton
                variant="primary"
                onClick={() => onNavigate('planner')}
                style={{ width: '100%' }}
                icon={<CalendarCheck size={15} />}
              >
                Open AI Study Planner
              </GlassButton>
            </div>
          </GlassCard>

          {/* Quick Demo / Sample Data Card */}
          <GlassCard>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <BookOpen
                size={20}
                style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '1px' }}
                aria-hidden="true"
              />
              <div>
                <h3
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  Interactive Study Demo
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginTop: '4px',
                    lineHeight: 1.55,
                  }}
                >
                  All notes and quiz histories are saved locally in this browser. Load sample
                  study material to evaluate the full flow instantly.
                </p>
                <GlassButton
                  variant="ghost"
                  onClick={onLoadSampleData}
                  style={{
                    marginTop: '10px',
                    fontSize: '0.875rem',
                    padding: '5px 12px',
                    color: 'var(--accent-blue)',
                  }}
                >
                  Load Sample Study Material
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Recent Notes Section */}
      <GlassCard
        title="Recent Uploaded Notes"
        subtitle="Lecture notes and summaries available for tutor chat and quizzes."
        action={
          <GlassButton
            variant="ghost"
            onClick={() => onNavigate('notes')}
            icon={<ArrowRight size={14} />}
            style={{ fontSize: '0.875rem' }}
          >
            View All
          </GlassButton>
        }
      >
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 16px' }}>
            <FileText
              size={30}
              style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }}
              aria-hidden="true"
            />
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              No study notes uploaded yet.
            </p>
            <GlassButton
              variant="secondary"
              onClick={() => onNavigate('notes')}
              style={{ marginTop: '12px' }}
            >
              Upload PDF or Paste Text
            </GlassButton>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '14px',
            }}
          >
            {notes.slice(0, 3).map((note) => (
              <button
                key={note.id}
                className="note-card-mini"
                onClick={() => onNavigate('notes')}
                style={{ textAlign: 'left', width: '100%' }}
                aria-label={`Open note: ${note.title}`}
              >
                <h4
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                    lineHeight: 1.3,
                  }}
                >
                  {note.title}
                </h4>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {note.summary}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '10px',
                  }}
                >
                  <span className="glass-badge glass-badge-indigo">
                    {note.keyConcepts.length} Concepts
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatDate(note.createdAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Visually hidden utility class */}
      <style>{`.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}`}</style>
    </div>
  );
};
