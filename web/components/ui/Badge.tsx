import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type variant = 'matchScore' | 'status' | 'category';
type size = 'sm' | 'md';

function toneForScore(score: number): 'success' | 'warn' | 'neutral' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warn';
  return 'neutral';
}

const tones = {
  success: 'bg-success/10 text-success border-success/30 success',
  warn: 'bg-warn/10 text-warn border-warn/30 warn',
  neutral: 'bg-bg-subtle text-fg-muted border-border neutral'
} as const;

const sizes: Record<size, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1'
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: variant;
  size?: size;
  score?: number;
  children: ReactNode;
}

export function Badge({ variant = 'status', size = 'md', score, className, children, ...rest }: BadgeProps) {
  const tone = variant === 'matchScore' && typeof score === 'number' ? toneForScore(score) : 'neutral';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        variant === 'matchScore' ? `${tones[tone]} matchScore` : 'bg-bg-subtle text-fg border-border',
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
