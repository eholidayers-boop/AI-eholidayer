import { describe, it, expect, vi } from 'vitest';

const createMock = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { stream: createMock }; }
}));

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn().mockResolvedValue(0),
    incrby: vi.fn().mockResolvedValue(0),
    expire: vi.fn().mockResolvedValue(1)
  }
}));

import { AnthropicProvider } from '@/lib/ai/anthropic';

describe('AnthropicProvider', () => {
  it('streams text_delta events from SDK events', async () => {
    createMock.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hi' } };
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' there' } };
        yield { type: 'message_stop' };
      }
    });
    const p = new AnthropicProvider('key');
    const events = [];
    for await (const e of p.chat({ messages: [{ role: 'user', content: 'hello' }] })) events.push(e);
    expect(events).toContainEqual({ type: 'text_delta', text: 'Hi' });
    expect(events).toContainEqual({ type: 'text_delta', text: ' there' });
    expect(events).toContainEqual({ type: 'message_stop', reason: 'end_turn' });
  });
});
