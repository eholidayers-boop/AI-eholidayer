import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils/cn';

describe('cn', () => {
  it('joins string class names with spaces', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('skips falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('dedupes tailwind classes, last wins', () => {
    expect(cn('px-2 px-4', 'px-6')).toBe('px-6');
  });
});
