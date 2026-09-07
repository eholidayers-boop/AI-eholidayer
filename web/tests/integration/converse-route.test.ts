import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    expire: vi.fn().mockResolvedValue(1)
  }
}));

vi.mock('@/lib/inventory/client', () => ({
  InventoryClient: class {
    searchHotels = vi.fn().mockResolvedValue({ hotels: [] });
    getHotelDetails = vi.fn();
    getRoomOptions = vi.fn();
    getAvailability = vi.fn();
    getDestinations = vi.fn();
  }
}));

vi.mock('@/lib/ai/anthropic', () => ({
  AnthropicProvider: class {
    async *chat() {
      yield { type: 'text_delta', text: 'Hi' };
      yield { type: 'message_stop', reason: 'end_turn' };
    }
    async extractIntent() { return { destination: 'X' }; }
  }
}));

import { POST } from '@/app/api/ai/converse/route';

describe('POST /api/ai/converse', () => {
  it('returns SSE response with text_delta event', async () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic');
    const req = new Request('http://localhost/api/ai/converse', {
      method: 'POST',
      body: JSON.stringify({ message: 'hello' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await POST(req as any);
    const text = await res.text();
    expect(text).toContain('event: text_delta');
    expect(text).toContain('event: done');
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});
