import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runToolLoop } from '@/lib/ai/toolLoop';
import type { AIProvider, ChatEvent } from '@/lib/ai/provider';

function makeProvider(events: ChatEvent[]): AIProvider {
  return {
    async *chat() { for (const e of events) yield e; },
    async extractIntent() { return {}; }
  };
}

const fakeClient: any = {
  searchHotels: vi.fn().mockResolvedValue({ hotels: [{ id: '1', name: 'Test Hotel', destination: { name: 'X', country: 'Y' }, priceFrom: { amount: 100, currency: 'USD' }, rating: 9, category: 5, reviewCount: 10, thumbnail: '', amenities: [], slug: 'test' }] }),
  getHotelDetails: vi.fn(), getRoomOptions: vi.fn(), getAvailability: vi.fn(), getDestinations: vi.fn()
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('runToolLoop', () => {
  it('executes search_hotels and returns ranked hotels', async () => {
    const provider = makeProvider([
      { type: 'text_delta', text: 'Let me find some.' },
      { type: 'tool_use', name: 'search_hotels', input: { destination: 'X' } },
      { type: 'text_delta', text: 'How about Test Hotel?' },
      { type: 'message_stop', reason: 'end_turn' }
    ]);
    const onEvent = vi.fn();
    const result = await runToolLoop(provider, {}, fakeClient, onEvent);
    expect(result.text).toContain('Test Hotel');
    expect(result.rankedHotels[0].id).toBe('1');
    expect(fakeClient.searchHotels).toHaveBeenCalled();
  });

  it('stops after 5 tool calls', async () => {
    const events = [];
    for (let i = 0; i < 10; i++) {
      events.push({ type: 'tool_use' as const, name: 'search_hotels', input: { destination: 'X' } });
    }
    events.push({ type: 'message_stop' as const, reason: 'end_turn' });
    const provider = makeProvider(events);
    const onEvent = vi.fn();
    await runToolLoop(provider, {}, fakeClient, onEvent);
    expect(fakeClient.searchHotels).toHaveBeenCalledTimes(5);
  });
});
