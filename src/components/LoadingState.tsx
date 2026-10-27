import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  description?: string;
  icon?: 'sparkles' | 'spinner';
}

/**
 * Accessible loading state with descriptive text, glass surface,
 * and pulsing icon. Uses global CSS animations.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Processing with Gemini…',
  description = 'Analyzing your study material and generating structured insights.',
  icon = 'sparkles',
}) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '40px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: '#FFFFFF',
      }}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'rgba(0, 122, 255, 0.08)',
          border: '1.5px solid rgba(0, 122, 255, 0.20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0, 122, 255, 0.12)',
        }}
        aria-hidden="true"
      >
        {icon === 'sparkles' ? (
          <Sparkles
            size={22}
            style={{
              color: 'var(--accent-blue)',
              animation: 'shimmer 1.8s ease-in-out infinite',
            }}
          />
        ) : (
          <Loader2
            size={22}
            style={{
              color: 'var(--accent-blue)',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
      </div>

      <div>
        <h4
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h4>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginTop: '4px',
            maxWidth: '380px',
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      </div>

      {/* Animated dots for visual feedback */}
      <div
        style={{ display: 'flex', gap: '5px', alignItems: 'center' }}
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'var(--accent-blue)',
              opacity: 0.5,
              animation: `pulse-dot 1.4s ${i * 0.22}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
