import React, { useState, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Trash2,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { GlassInput, GlassTextarea } from '../components/GlassInput';
import { LoadingState } from '../components/LoadingState';
import { ErrorMessage } from '../components/ErrorMessage';
import { NoteSummary } from '../types';
import { api } from '../services/api';
import { notesService } from '../services/notesService';
import { NavigationPage } from '../components/GlassSidebar';

interface AINotesProps {
  notes: NoteSummary[];
  onNotesUpdated: (notes: NoteSummary[]) => void;
  onNavigate: (page: NavigationPage) => void;
  onSelectNoteForContext: (note: NoteSummary) => void;
}

const IMPORTANCE_BADGE: Record<string, string> = {
  high: 'glass-badge-rose',
  medium: 'glass-badge-amber',
  low: 'glass-badge-indigo',
};

export const AINotes: React.FC<AINotesProps> = ({
  notes,
  onNotesUpdated,
  onNavigate,
  onSelectNoteForContext,
}) => {
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [selectedNote, setSelectedNote] = useState<NoteSummary | null>(notes[0] || null);
  const [isDragging, setIsDragging] = useState(false);

  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setIsLoadingPdf(true);

      try {
        const extracted = await api.extractPdfText(file);
        setRawText(extracted.text);
        if (!title) {
          const derivedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setTitle(derivedTitle);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to extract text from PDF.');
      } finally {
        setIsLoadingPdf(false);
        e.target.value = '';
      }
    },
    [title]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      const fakeEvent = {
        target: { files: e.dataTransfer.files, value: '' },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    },
    [handleFileUpload]
  );

  const handleGenerateSummary = async () => {
    if (!rawText.trim()) {
      setError('Please provide study text or upload a PDF first.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await api.generateSummary({
        text: rawText,
        title: title.trim() || undefined,
      });

      const newNote: NoteSummary = {
        id: `note-${Date.now()}`,
        title: response.title,
        rawText,
        summary: response.summary,
        keyConcepts: response.keyConcepts,
        examPoints: response.examPoints,
        createdAt: new Date().toISOString(),
        wordCount: response.wordCount,
      };

      const updatedNotes = notesService.saveNote(newNote);
      onNotesUpdated(updatedNotes);
      setSelectedNote(newNote);
      setTitle('');
      setRawText('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate study summary.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note permanently?')) return;
    const updated = notesService.deleteNote(id);
    onNotesUpdated(updated);
    if (selectedNote?.id === id) {
      setSelectedNote(updated[0] || null);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Silent — clipboard API unavailable
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Title */}
      <div>
        <h1 className="page-title">AI Study Notes</h1>
        <p className="page-subtitle">
          Transform unstructured PDFs and lecture transcripts into structured concept sheets and
          revision summaries.
        </p>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {/* Main Grid — Input Panel + Note Viewer */}
      <div
        className="notes-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 420px) 1fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Input Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <GlassCard title="Add Study Material" subtitle="Upload a PDF or paste lecture transcripts directly.">
            {/* PDF Upload Dropzone */}
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="pdf-file-input"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'rgba(0, 0, 0, 0.14)'}`,
                  background: isDragging ? 'var(--accent-blue-subtle)' : '#FAFAFA',
                  cursor: isLoadingPdf || isGenerating ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)',
                  opacity: isLoadingPdf || isGenerating ? 0.6 : 1,
                  gap: '8px',
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                aria-label={isLoadingPdf ? 'Extracting PDF…' : 'Click to upload PDF, or drag and drop here'}
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={isLoadingPdf || isGenerating}
                  aria-hidden="true"
                />
                <UploadCloud
                  size={26}
                  style={{ color: isDragging ? 'var(--accent-blue)' : 'var(--text-muted)' }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    color: isDragging ? 'var(--accent-blue)' : 'var(--text-primary)',
                  }}
                >
                  {isLoadingPdf ? 'Extracting PDF text…' : 'Click or drop PDF here'}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Maximum 10 MB · Text-based PDFs
                </span>
              </label>
            </div>

            {/* Title & Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <GlassInput
                label="Topic Title (Optional)"
                placeholder="e.g. Operating Systems: Virtual Memory"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isGenerating || isLoadingPdf}
                id="notes-title"
              />

              <GlassTextarea
                label="Lecture Text or Notes"
                placeholder="Paste lecture notes, textbook excerpts, or syllabus points here…"
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                disabled={isGenerating || isLoadingPdf}
                helperText={rawText.length > 0 ? `${rawText.length.toLocaleString()} characters` : undefined}
                id="notes-rawtext"
              />

              <GlassButton
                variant="primary"
                onClick={handleGenerateSummary}
                isLoading={isGenerating || isLoadingPdf}
                disabled={!rawText.trim()}
                icon={<Sparkles size={15} />}
                style={{ width: '100%' }}
                aria-label="Generate AI revision notes from the entered text"
              >
                Generate Revision Notes
              </GlassButton>
            </div>
          </GlassCard>

          {/* Notes Library */}
          <GlassCard
            title="Saved Notes"
            subtitle={`${notes.length} document${notes.length !== 1 ? 's' : ''} saved locally`}
          >
            {notes.length === 0 ? (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '16px',
                  lineHeight: 1.5,
                }}
              >
                No notes saved yet. Generate your first summary above!
              </p>
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}
                role="listbox"
                aria-label="Saved notes library"
              >
                {notes.map((note) => {
                  const isSelected = selectedNote?.id === note.id;
                  return (
                    <div
                      key={note.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => setSelectedNote(note)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedNote(note); }}
                      tabIndex={0}
                      style={{
                        padding: '10px 13px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--accent-blue-subtle)' : '#FFFFFF',
                        border: `1.5px solid ${isSelected ? 'var(--accent-blue-border)' : 'var(--glass-border)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'all var(--transition-fast)',
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)';
                      }}
                      onBlur={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--glass-border)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                        <FileText
                          size={15}
                          style={{
                            color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        />
                        <span
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {note.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        aria-label={`Delete note: ${note.title}`}
                        title="Delete note"
                        style={{
                          color: 'var(--text-muted)',
                          padding: '4px',
                          borderRadius: 'var(--radius-xs)',
                          flexShrink: 0,
                          transition: 'color var(--transition-fast)',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Note Viewer */}
        <div>
          {isGenerating ? (
            <LoadingState
              title="Gemini is synthesizing concepts…"
              description="Extracting key definitions, structuring executive summaries, and compiling high-yield exam points."
            />
          ) : selectedNote ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              aria-label={`Note: ${selectedNote.title}`}
            >
              <GlassCard
                title={selectedNote.title}
                subtitle={`${selectedNote.wordCount.toLocaleString()} words · Synthesized with Gemini`}
                action={
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <GlassButton
                      variant="secondary"
                      onClick={() => {
                        onSelectNoteForContext(selectedNote);
                        onNavigate('tutor');
                      }}
                      icon={<MessageSquare size={14} />}
                      style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                    >
                      Ask Tutor
                    </GlassButton>
                    <GlassButton
                      variant="primary"
                      onClick={() => {
                        onSelectNoteForContext(selectedNote);
                        onNavigate('quiz');
                      }}
                      icon={<HelpCircle size={14} />}
                      style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                    >
                      Generate Quiz
                    </GlassButton>
                  </div>
                }
              >
                {/* Executive Summary */}
                <section aria-label="Executive summary" style={{ marginBottom: '22px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '9px',
                    }}
                  >
                    <h2
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--accent-blue)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Executive Summary
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedNote.summary, 'summary')}
                      aria-label={copiedId === 'summary' ? 'Summary copied' : 'Copy summary'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        fontFamily: 'inherit',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        transition: 'color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      {copiedId === 'summary' ? (
                        <Check size={13} style={{ color: 'var(--accent-emerald-dark)' }} aria-hidden="true" />
                      ) : (
                        <Copy size={13} aria-hidden="true" />
                      )}
                      {copiedId === 'summary' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: '0.9375rem',
                      lineHeight: 1.65,
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-line',
                      background: '#F8F9FB',
                      padding: '16px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--glass-border)',
                    }}
                  >
                    {selectedNote.summary}
                  </div>
                </section>

                {/* Core Concepts */}
                {selectedNote.keyConcepts.length > 0 && (
                  <section aria-label="Key concepts and definitions" style={{ marginBottom: '22px' }}>
                    <h2
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--accent-indigo)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '10px',
                      }}
                    >
                      Key Concepts &amp; Definitions
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedNote.keyConcepts.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '13px 16px',
                            borderRadius: 'var(--radius-md)',
                            background: '#FFFFFF',
                            border: '1.5px solid var(--glass-border)',
                            boxShadow: 'var(--glass-shadow-sm)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '5px',
                              gap: '10px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.9375rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {c.term}
                            </span>
                            <span
                              className={`glass-badge ${IMPORTANCE_BADGE[c.importance] || 'glass-badge-indigo'}`}
                              aria-label={`${c.importance} importance`}
                            >
                              {c.importance} yield
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: '0.875rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.55,
                            }}
                          >
                            {c.definition}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Exam Points */}
                {selectedNote.examPoints.length > 0 && (
                  <section aria-label="Exam revision highlights">
                    <h2
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--accent-emerald-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '10px',
                      }}
                    >
                      Exam Revision Highlights
                    </h2>
                    <ul
                      style={{
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {selectedNote.examPoints.map((point, i) => (
                        <li
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.55,
                          }}
                        >
                          <CheckCircle2
                            size={16}
                            style={{ color: 'var(--accent-emerald-dark)', flexShrink: 0, marginTop: '2px' }}
                            aria-hidden="true"
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </GlassCard>
            </div>
          ) : (
            <GlassCard style={{ textAlign: 'center', padding: '52px 24px' }}>
              <BookOpen
                size={44}
                style={{ color: 'var(--text-muted)', margin: '0 auto 14px' }}
                aria-hidden="true"
              />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                No Note Selected
              </h2>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  marginTop: '6px',
                  maxWidth: '340px',
                  margin: '6px auto 0',
                  lineHeight: 1.55,
                }}
              >
                Upload a lecture PDF on the left or paste your notes to generate structured
                revision materials.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
