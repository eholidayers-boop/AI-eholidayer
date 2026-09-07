import { describe, it, expect, vi } from 'vitest';
import { cached } from '@/lib/inventory/cache';

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK')
  }
}));

describe('cached', () => {
  it('calls fn on miss and stores result', async () => {
    const { kv } = await import('@vercel/kv');
    const fn = vi.fn().mockResolvedValue({ a: 1 });
    const r = await cached('k', 60, fn);
    expect(r).toEqual({ a: 1 });
    expect(fn).toHaveBeenCalledOnce();
    expect(kv.set).toHaveBeenCalledWith('k', { a: 1 }, { ex: 60 });
  });

  it('returns cached value on hit, fn not called', async () => {
    const { kv } = await import('@vercel/kv');
    (kv.get as any).mockResolvedValueOnce({ a: 9 });
    const fn = vi.fn();
    const r = await cached('k', 60, fn);
    expect(r).toEqual({ a: 9 });
    expect(fn).not.toHaveBeenCalled();
  });
});
