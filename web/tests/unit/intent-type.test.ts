import { describe, it, expectTypeOf } from 'vitest';
import type { Intent, ChatMessage } from '@/lib/ai/intent';

describe('Intent and ChatMessage types', () => {
  it('Intent has soft preferences 0-10', () => {
    expectTypeOf<Intent['softPreferences']>().toMatchTypeOf<Record<string, number | undefined> | undefined>();
  });
  it('ChatMessage has role and content', () => {
    expectTypeOf<ChatMessage>().toHaveProperty('role');
    expectTypeOf<ChatMessage>().toHaveProperty('content');
  });
});
