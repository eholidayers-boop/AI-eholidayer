import { describe, it, expect, vi } from 'vitest';
import { InventoryClient } from '@/lib/inventory/client';

describe('InventoryClient.searchHotels', () => {
  it('sends destination and returns mapped hotels', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({
        hotels: [{ id: '1', slug: 'a', name: 'A', destination: { id: '7', name: 'H', country: 'EG' }, category: 5, rating: 9, reviewCount: 10, priceFrom: { amount: 100, currency: 'USD' }, thumbnail: '', amenities: [] }],
        total: 1, page: 1
      })
    });
    const client = new InventoryClient('https://legacy.test', 'tok', { fetchImpl: fetchMock as any });
    const res = await client.searchHotels({ destination: '7' });
    expect(res.hotels).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('destination=7'), expect.objectContaining({ headers: expect.objectContaining({ 'X-API-Token': 'tok' }) }));
  });

  it('throws on non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    const client = new InventoryClient('https://legacy.test', 'tok', { fetchImpl: fetchMock as any });
    await expect(client.searchHotels({ destination: '7' })).rejects.toThrow();
  });
});
