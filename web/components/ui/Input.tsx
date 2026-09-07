import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type variant = 'default' | 'search' | 'chat';

const variants: Record<variant, string> = {
  default: 'h-10 px-3 text-base',
  search: 'h-11 pl-10 pr-3 text-base',
  chat: 'min-h-12 px-4 py-3 text-base resize-none chat'
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: variant;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', leadingIcon, trailingIcon, error, hint, className, id, type = 'text', ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="relative w-full">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'w-full rounded-md border bg-bg text-fg',
            'border-border focus:border-accent focus:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            variants[variant],
            leadingIcon && variant === 'search' && 'pl-10',
            error && 'border-error',
            className
          )}
          {...rest}
        />
        {trailingIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-fg-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
