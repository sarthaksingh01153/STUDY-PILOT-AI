import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { GlassButton } from './GlassButton';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Accessible error alert with ARIA live region, retry, and dismiss controls.
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  onDismiss,
  className = '',
}) => {
  return (
    <div
      className={`glass-card ${className}`}
      style={{
        padding: '14px 18px',
        border: '1.5px solid var(--color-error-border)',
        background: 'var(--color-error-subtle)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: '0 2px 10px rgba(220, 38, 38, 0.07)',
      }}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Icon */}
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: 'var(--radius-sm)',
          background: '#fee2e2',
          border: '1px solid var(--color-error-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-error)',
          flexShrink: 0,
          marginTop: '1px',
        }}
        aria-hidden="true"
      >
        <AlertCircle size={17} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: '#7f1d1d',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h4>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#991b1b',
            marginTop: '3px',
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          {message}
        </p>

        {onRetry && (
          <div style={{ marginTop: '10px' }}>
            <GlassButton
              variant="secondary"
              onClick={onRetry}
              icon={<RefreshCw size={13} />}
              style={{
                fontSize: '0.875rem',
                padding: '5px 12px',
                background: '#ffffff',
                color: '#991b1b',
                borderColor: '#fca5a5',
              }}
            >
              Try Again
            </GlassButton>
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{
            color: '#dc2626',
            padding: '4px',
            borderRadius: 'var(--radius-xs)',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            transition: 'opacity var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};
