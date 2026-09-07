import { describe, it, expect, vi } from 'vitest';

const { kvMock } = vi.hoisted(() => ({ kvMock: { incr: vi.fn(), expire: vi.fn() } }));
vi.mock('@vercel/kv', () => ({ kv: kvMock }));

import { rateLimit } from '@/lib/security/rateLimit';

describe('rateLimit', () => {
  it('allows first 20 calls', async () => {
    kvMock.incr.mockResolvedValue(1);
    const ok = await rateLimit('s1');
    expect(ok).toBe(true);
  });

  it('blocks 21st call', async () => {
    kvMock.incr.mockResolvedValue(21);
    const ok = await rateLimit('s1');
    expect(ok).toBe(false);
  });
});
