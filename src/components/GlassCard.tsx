import React from 'react';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  glow?: 'indigo' | 'rose' | 'emerald' | 'none';
  onClick?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/**
 * Reusable Liquid Glass card with optional specular highlight, ambient glow,
 * and structured title/action header slot.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  style,
  interactive = false,
  glow = 'none',
  onClick,
  onKeyDown,
  title,
  subtitle,
  action,
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}) => {
  const glowClass =
    glow === 'indigo'
      ? 'glass-card-glow-indigo'
      : glow === 'rose'
      ? 'glass-card-glow-rose'
      : glow === 'emerald'
      ? 'glass-card-glow-emerald'
      : '';

  const interactiveClass = interactive ? 'glass-card-interactive' : '';
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      onKeyDown={isClickable ? onKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
      role={role || (isClickable ? 'button' : undefined)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={`glass-card ${glowClass} ${interactiveClass} ${className}`}
      style={{ padding: '22px 24px', ...style }}
    >
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '16px',
            gap: '12px',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            {title && (
              <h3
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.25,
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-tertiary)',
                  marginTop: '3px',
                  lineHeight: 1.45,
                  fontWeight: 400,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div style={{ flexShrink: 0 }}>{action}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
