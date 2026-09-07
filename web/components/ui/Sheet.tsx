'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: 'right' | 'bottom';
  children: ReactNode;
}

export function Sheet({ open, onClose, side = 'right', children }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-fg/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute bg-bg border border-border shadow-lg',
          side === 'right'
            ? 'right-0 top-0 h-full w-full max-w-md p-6 overflow-y-auto'
            : 'bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl p-4 overflow-y-auto'
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 h-9 w-9 rounded-full text-fg-muted hover:bg-bg-subtle"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
