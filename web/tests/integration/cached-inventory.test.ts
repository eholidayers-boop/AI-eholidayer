import { describe, it, expect, vi } from 'vitest';
import { InventoryClient } from '@/lib/inventory/client';

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK')
  }
}));
vi.mock('@/lib/inventory/cache', () => ({
  cached: vi.fn(async (_k, _t, fn) => fn())
}));

describe('InventoryClient with cache wrapper', () => {
  it('caches destination list with 1h TTL', async () => {
    const { cached } = await import('@/lib/inventory/cache');
    const client = new InventoryClient('https://x', 't');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ destinations: [] }) });
    (client as any).opts.fetchImpl = fetchMock;
    await client.getDestinations();
    expect(cached).toHaveBeenCalledWith('destinations:all', 3600, expect.any(Function));
  });
});
