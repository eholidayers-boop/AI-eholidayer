import { describe, it, expect } from 'vitest';
import { MockProvider } from '@/lib/ai/mock';

describe('MockProvider', () => {
  it('matches hurghada keyword and emits tool_use', async () => {
    const p = new MockProvider();
    const events = [];
    for await (const e of p.chat({ messages: [{ role: 'user', content: 'I want to go to Hurghada' }] })) events.push(e);
    expect(events.some(e => e.type === 'text_delta')).toBe(true);
    expect(events.some(e => e.type === 'tool_use' && (e as any).name === 'search_hotels')).toBe(true);
  });

  it('falls through to default script when no match', async () => {
    const p = new MockProvider();
    const events = [];
    for await (const e of p.chat({ messages: [{ role: 'user', content: 'something random' }] })) events.push(e);
    expect(events.length).toBeGreaterThan(0);
  });
});
