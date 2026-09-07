'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const SUGGESTIONS = [
  'Romantic hotel in Paris',
  'Family resort in Hurghada',
  'Luxury in Dubai under $500',
  'Quiet beach hotel'
];

export function AIHeroInput() {
  const [value, setValue] = useState('');

  return (
    <form
      className="w-full max-w-2xl mx-auto"
      onSubmit={(e) => {
        e.preventDefault();
        // No-op in M1; wired in M5
      }}
    >
      <div className="flex gap-2">
        <Input
          variant="chat"
          placeholder="I'm going to Hurghada with my wife for 4 nights..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Describe your ideal stay"
        />
        <Button type="submit" size="lg">Find</Button>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2 text-sm">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => setValue(s)}
              className="rounded-full bg-bg-subtle px-3 py-1 text-fg-muted hover:bg-accent-soft hover:text-accent"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </form>
  );
}
