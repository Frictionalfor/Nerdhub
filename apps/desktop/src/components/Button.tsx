import { forwardRef, type RefAttributes } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Base interactive button.
 *
 * Conventions:
 * - Explicit `type` default ("button") so it never submits a form by accident.
 * - Visible focus ring for keyboard users.
 * - Disabled state is styled and prevents interaction.
 * - `aria-disabled` mirrors the disabled state for assistive tech.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, disabled, type = 'button', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants: Record<string, string> = {
      primary:
        'bg-violet-600 border-violet-600 text-white hover:bg-violet-500 focus-visible:ring-violet-600',
      secondary:
        'bg-cyan-500 border-cyan-500 text-white hover:bg-cyan-400 focus-visible:ring-cyan-500',
      ghost:
        'border-transparent text-violet-600 hover:bg-violet-600/10 focus-visible:ring-violet-600',
      danger: 'bg-red-600 border-red-600 text-white hover:bg-red-500 focus-visible:ring-red-600',
    };

    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2',
      lg: 'px-6 py-2.5 text-base',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ''}`}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

type ButtonComp = typeof Button & RefAttributes<HTMLButtonElement>;

export default Button as ButtonComp;
