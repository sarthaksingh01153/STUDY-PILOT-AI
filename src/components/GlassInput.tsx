import React from 'react';

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseInputProps {}

export interface GlassTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseInputProps {}

/**
 * Reusable text input with translucent glass styling and glow focus ring.
 */
export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`glass-input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="glass-label">
          {label}
        </label>
      )}
      <input id={inputId} className="glass-input" {...props} />
      {helperText && !error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{helperText}</span>
      )}
      {error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--accent-rose)' }}>{error}</span>
      )}
    </div>
  );
};

/**
 * Multi-line glass textarea for study materials and long notes.
 */
export const GlassTextarea: React.FC<GlassTextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 4,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`glass-input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="glass-label">
          {label}
        </label>
      )}
      <textarea id={inputId} rows={rows} className="glass-textarea" {...props} />
      {helperText && !error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{helperText}</span>
      )}
      {error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--accent-rose)' }}>{error}</span>
      )}
    </div>
  );
};
