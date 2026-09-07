import { describe, it, expect, vi } from 'vitest';

const { kvMock } = vi.hoisted(() => ({
  kvMock: { get: vi.fn().mockResolvedValue(0), incrby: vi.fn().mockResolvedValue(100), expire: vi.fn() }
}));
vi.mock('@vercel/kv', () => ({ kv: kvMock }));

import { assertBudget, recordUsage } from '@/lib/security/tokenBudget';

describe('token budget', () => {
  it('assertBudget allows under limit', async () => {
    kvMock.get.mockResolvedValue(100);
    await expect(assertBudget()).resolves.not.toThrow();
  });
  it('assertBudget throws over limit', async () => {
    kvMock.get.mockResolvedValue(2_000_001);
    await expect(assertBudget()).rejects.toThrow(/budget/i);
  });
  it('recordUsage adds and sets 1d expiry', async () => {
    await recordUsage(500);
    expect(kvMock.incrby).toHaveBeenCalled();
    expect(kvMock.expire).toHaveBeenCalled();
  });
});
