import type { HTMLProps } from 'react';

interface CardProps extends HTMLProps<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Surface card. Renders a bordered, rounded container with optional padding.
 */
export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  const paddings: Record<string, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      {...props}
      className={`rounded-lg border border-border bg-surface text-text-primary ${paddings[padding]} ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
