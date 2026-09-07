import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type size = 'sm' | 'md' | 'lg';

const variants: Record<variant, string> = {
  primary: 'bg-accent text-bg hover:opacity-90',
  secondary: 'bg-bg-subtle text-fg border border-border hover:border-accent secondary',
  ghost: 'bg-transparent text-fg hover:bg-bg-subtle',
  destructive: 'bg-error text-bg hover:opacity-90'
};

const sizes: Record<size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg'
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: variant;
  size?: size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        data-variant={variant}
        data-size={size}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-opacity',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...rest}
      >
        {loading ? <span aria-hidden="true">...</span> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
