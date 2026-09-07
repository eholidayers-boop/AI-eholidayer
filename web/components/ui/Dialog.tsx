'use client';

import * as RDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-fg/40 backdrop-blur-sm" />
        <RDialog.Content
          aria-describedby={description ? 'dialog-desc' : undefined}
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-bg p-6 shadow-lg border border-border"
        >
          <RDialog.Title className="font-display text-xl text-fg mb-2">{title}</RDialog.Title>
          {description && (
            <RDialog.Description id="dialog-desc" className="text-fg-muted mb-4">
              {description}
            </RDialog.Description>
          )}
          {children}
          <RDialog.Close
            aria-label="Close"
            className="absolute top-3 right-3 h-9 w-9 rounded-full text-fg-muted hover:bg-bg-subtle"
          >
            ×
          </RDialog.Close>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
