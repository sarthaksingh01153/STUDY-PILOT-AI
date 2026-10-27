import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  BookOpen,
  Bot,
  User,
  Trash2,
  Square,
  Copy,
  Check,
} from 'lucide-react';
import { GlassButton } from '../components/GlassButton';
import { ErrorMessage } from '../components/ErrorMessage';
import { ChatMessage, NoteSummary } from '../types';
import { api } from '../services/api';

interface AITutorProps {
  notes: NoteSummary[];
  activeNoteContext: NoteSummary | null;
  onSelectContextNote: (note: NoteSummary | null) => void;
}

/* ── Lightweight Markdown Renderer ──────────────────────────────── */
interface FormattedMessageProps {
  content: string;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = useCallback(async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Clipboard not available — silent fail
    }
  }, []);

  // Split on fenced code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          let language = 'code';
          let codeLines = lines;
          if (lines[0] && !lines[0].includes(' ') && lines[0].length < 20) {
            language = lines[0].trim();
            codeLines = lines.slice(1);
          }
          const codeString = codeLines.join('\n');

          return (
            <div key={index} className="code-block" role="region" aria-label={`${language} code block`}>
              <div className="code-block-header">
                <span>{language}</span>
                <button
                  type="button"
                  className="code-copy-btn"
                  onClick={() => handleCopyCode(codeString, index)}
                  aria-label={copiedIndex === index ? 'Code copied' : 'Copy code to clipboard'}
                >
                  {copiedIndex === index ? (
                    <>
                      <Check size={12} style={{ color: '#34D399' }} aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} aria-hidden="true" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="code-block-body">
                <code>{codeString}</code>
              </pre>
            </div>
          );
        }

        // Standard text — render with bold and inline code
        const textLines = part.split('\n');
        return (
          <div key={index}>
            {textLines.map((line, lineIdx) => {
              const isBullet = /^[\*\-]\s/.test(line.trim());
              const cleanLine = isBullet ? line.trim().slice(2) : line;

              // Bold (**text**) and inline code (`code`)
              const boldParts = cleanLine.split(/(\*\*.*?\*\*)/g);

              const renderedLine = boldParts.map((seg, sIdx) => {
                if (seg.startsWith('**') && seg.endsWith('**')) {
                  return (
                    <strong key={sIdx} style={{ fontWeight: 700, color: 'inherit' }}>
                      {seg.slice(2, -2)}
                    </strong>
                  );
                }
                const codeParts = seg.split(/(`.*?`)/g);
                return codeParts.map((codeSeg, cIdx) => {
                  if (codeSeg.startsWith('`') && codeSeg.endsWith('`')) {
                    return (
                      <code key={cIdx} className="inline-code">
                        {codeSeg.slice(1, -1)}
                      </code>
                    );
                  }
                  return <span key={cIdx}>{codeSeg}</span>;
                });
              });

              if (line.trim() === '') {
                return <div key={lineIdx} style={{ height: '6px' }} aria-hidden="true" />;
              }

              return (
                <div
                  key={lineIdx}
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    paddingLeft: isBullet ? '0' : '0',
                    display: isBullet ? 'flex' : 'block',
                    gap: isBullet ? '8px' : '0',
                    marginBottom: '2px',
                  }}
                >
                  {isBullet && (
                    <span
                      style={{
                        color: 'var(--accent-blue)',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                      aria-hidden="true"
                    >
                      •
                    </span>
                  )}
                  <span>{renderedLine}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/* ── Typing Indicator ────────────────────────────────────────────── */
const TypingIndicator: React.FC = () => (
  <div
    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '2px 0' }}
    aria-label="AI is thinking"
    role="status"
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'var(--accent-blue)',
          opacity: 0.5,
          animation: `pulse-dot 1.2s ${i * 0.18}s ease-in-out infinite`,
        }}
        aria-hidden="true"
      />
    ))}
    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
      Thinking…
    </span>
  </div>
);

/* ── Main AI Tutor Component ─────────────────────────────────────── */
export const AITutor: React.FC<AITutorProps> = ({
  notes,
  activeNoteContext,
  onSelectContextNote,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hey there! I'm your StudyPilot AI Tutor. Ask me anything—whether it's breaking down complex concepts, writing code, or reviewing your uploaded notes. How can I help today?",
      timestamp: Date.now(),
      groundedInNotes: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom only when near bottom
  const scrollToBottom = useCallback(() => {
    const el = chatScrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating, scrollToBottom]);

  // Build context text from selected note or all notes
  const notesContextText = activeNoteContext
    ? `Document Title: ${activeNoteContext.title}\nExecutive Summary: ${activeNoteContext.summary}\nKey Concepts:\n${activeNoteContext.keyConcepts.map((c) => `- ${c.term}: ${c.definition}`).join('\n')}\nNotes Excerpt:\n${activeNoteContext.rawText.substring(0, 10000)}`
    : notes.length > 0
    ? notes
        .map(
          (n) =>
            `Topic: ${n.title}\nSummary: ${n.summary}\nKey Definitions: ${n.keyConcepts.map((c) => c.term).join(', ')}`
        )
        .join('\n\n')
    : '';

  const handleSend = async () => {
    const userQuestion = input.trim();
    if (!userQuestion || isGenerating) return;

    setInput('');
    setError(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userQuestion,
      timestamp: Date.now(),
    };

    const assistantMsgId = `tutor-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      groundedInNotes: Boolean(activeNoteContext),
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMsg]);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      await api.askTutorStream(
        { message: userQuestion, notesContext: notesContextText, history },
        (chunkText: string) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: m.content + chunkText } : m
            )
          );
        },
        controller.signal
      );
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : 'Tutor request failed.';
      setError(msg);
      // Remove empty assistant placeholder on failure
      setMessages((prev) =>
        prev.filter((m) => m.id !== assistantMsgId || m.content.length > 0)
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    handleStop();
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Chat cleared! What would you like to explore next?',
        timestamp: Date.now(),
        groundedInNotes: false,
      },
    ]);
  };

  const samplePrompts = [
    'Say hello 👋',
    'Explain C++ loops with an example',
    'What causes thrashing in virtual memory?',
    'Give me a quick study tip',
  ];

  return (
    <div className="chat-container">
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div>
          <h1 className="page-title">AI Study Tutor</h1>
          <p className="page-subtitle">
            Fast, natural conversational tutor. Ask general questions or explore your uploaded notes.
          </p>
        </div>

        {/* Context Selector + Clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <label
            htmlFor="tutor-context-select"
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Context:
          </label>
          <select
            id="tutor-context-select"
            className="glass-select"
            value={activeNoteContext?.id || 'all'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all') {
                onSelectContextNote(null);
              } else {
                const found = notes.find((n) => n.id === val);
                if (found) onSelectContextNote(found);
              }
            }}
            style={{ width: '200px', fontSize: '0.875rem', padding: '7px 36px 7px 12px', minHeight: '36px' }}
            aria-label="Select note context for AI Tutor"
          >
            <option value="all">
              {notes.length > 0 ? `All Notes (${notes.length})` : 'General Knowledge'}
            </option>
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title.length > 32 ? n.title.slice(0, 32) + '…' : n.title}
              </option>
            ))}
          </select>

          <GlassButton
            variant="ghost"
            onClick={handleClearChat}
            icon={<Trash2 size={14} />}
            style={{ fontSize: '0.875rem', padding: '6px 12px' }}
            aria-label="Clear conversation history"
          >
            Clear
          </GlassButton>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {/* Main Chat Panel */}
      <div
        className="chat-panel"
        role="main"
        aria-label="Chat conversation"
      >
        {/* Context Indicator Strip */}
        <div className="chat-context-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <BookOpen size={13} style={{ color: 'var(--accent-blue)' }} aria-hidden="true" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {activeNoteContext
                ? `Grounded in: "${activeNoteContext.title.length > 40 ? activeNoteContext.title.slice(0, 40) + '…' : activeNoteContext.title}"`
                : notes.length > 0
                ? `Context: ${notes.length} uploaded document(s)`
                : 'General knowledge mode'}
            </span>
          </div>
          <span className="glass-badge glass-badge-indigo" style={{ fontSize: '0.6875rem' }}>
            Streaming
          </span>
        </div>

        {/* Message Bubbles */}
        <div
          ref={chatScrollContainerRef}
          className="chat-messages"
          role="log"
          aria-live="polite"
          aria-label="Conversation messages"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '9px',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: isUser ? '76%' : '86%',
                  animation: 'fadeInUp 180ms var(--ease-spring) both',
                }}
              >
                {!isUser && (
                  <div className="chat-avatar-ai" aria-hidden="true">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    minWidth: 0,
                  }}
                >
                  <div
                    className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}
                    aria-label={`${isUser ? 'You' : 'AI Tutor'}: ${msg.content || 'thinking'}`}
                  >
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.content}
                      </div>
                    ) : msg.content ? (
                      <FormattedMessage content={msg.content} />
                    ) : (
                      <TypingIndicator />
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                      padding: '0 3px',
                    }}
                    aria-hidden="true"
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {isUser && (
                  <div className="chat-avatar-user" aria-hidden="true">
                    <User size={15} />
                  </div>
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        {/* Quick Suggestion Chips — show when conversation is fresh */}
        {messages.length <= 2 && !isGenerating && (
          <div
            style={{
              padding: '0 18px 10px',
              display: 'flex',
              gap: '7px',
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
            aria-label="Suggested prompts"
          >
            {samplePrompts.map((promptText, i) => (
              <button
                key={i}
                type="button"
                className="prompt-chip"
                onClick={() => setInput(promptText)}
                aria-label={`Use prompt: ${promptText}`}
              >
                {promptText}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="chat-input-bar" role="form" aria-label="Message input">
          <div style={{ flex: 1, position: 'relative' }}>
            <label htmlFor="tutor-input" className="sr-only">
              Type your message
            </label>
            <textarea
              id="tutor-input"
              ref={textareaRef}
              rows={1}
              className="glass-textarea"
              placeholder="Message your tutor… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              disabled={false} /* Always kept interactive */
              aria-label="Type your message to the AI tutor"
              aria-describedby="tutor-input-help"
              style={{
                resize: 'none',
                minHeight: '42px',
                maxHeight: '120px',
                padding: '10px 14px',
                lineHeight: 1.5,
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9375rem',
              }}
            />
            <div id="tutor-input-help" className="sr-only">
              Press Enter to send, Shift+Enter for a new line
            </div>
          </div>

          {isGenerating ? (
            <GlassButton
              type="button"
              variant="secondary"
              onClick={handleStop}
              icon={<Square size={13} style={{ fill: 'currentColor' }} />}
              style={{
                padding: '10px 14px',
                color: 'var(--color-error)',
                borderColor: 'var(--color-error-border)',
                flexShrink: 0,
              }}
              aria-label="Stop AI response generation"
            >
              Stop
            </GlassButton>
          ) : (
            <GlassButton
              type="button"
              variant="primary"
              onClick={handleSend}
              disabled={!input.trim()}
              icon={<Send size={14} />}
              style={{ padding: '10px 16px', flexShrink: 0 }}
              aria-label="Send message"
            >
              Send
            </GlassButton>
          )}
        </div>
      </div>

      {/* Screen reader utility */}
      <style>{`.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}`}</style>
    </div>
  );
};
