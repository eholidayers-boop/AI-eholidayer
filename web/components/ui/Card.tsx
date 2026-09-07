import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type variant = 'elevated' | 'bordered' | 'filled';

const variants: Record<variant, string> = {
  elevated: 'bg-bg shadow-sm',
  bordered: 'bg-bg border border-border bordered',
  filled: 'bg-bg-subtle'
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: variant;
  children: ReactNode;
}

export function Card({ variant = 'elevated', className, children, ...rest }: CardProps) {
  return (
    <article data-variant={variant} className={cn('rounded-lg p-4', variants[variant], className)} {...rest}>
      {children}
    </article>
  );
}
