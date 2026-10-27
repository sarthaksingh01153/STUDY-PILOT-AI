import React from 'react';
import { Loader2 } from 'lucide-react';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

/**
 * Modern Liquid Glass button with smooth hover states, accessible focus outlines,
 * and loading/disabled states.
 */
export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  icon,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const variantClass = `glass-btn-${variant}`;

  return (
    <button
      type={type}
      className={`glass-btn ${variantClass} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2
            size={15}
            style={{ animation: 'spin 1s linear infinite' }}
            aria-hidden="true"
          />
          <span>Processing…</span>
        </>
      ) : (
        <>
          {icon && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
              {icon}
            </span>
          )}
          {children}
        </>
      )}
    </button>
  );
};
