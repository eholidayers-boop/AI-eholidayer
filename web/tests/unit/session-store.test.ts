import { describe, it, expect, vi } from 'vitest';

const { kvMock } = vi.hoisted(() => ({
  kvMock: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    expire: vi.fn().mockResolvedValue(1)
  }
}));

vi.mock('@vercel/kv', () => ({ kv: kvMock }));

import { getSession, saveSession } from '@/lib/session/store';
import type { ConversationState } from '@/lib/ai/intent';

describe('session store', () => {
  it('saveSession stores with 30d TTL', async () => {
    const state: ConversationState = { sessionId: 's1', messages: [], extractedPreferences: {}, searchContext: {}, createdAt: 'x', updatedAt: 'x' };
    await saveSession(state);
    expect(kvMock.set).toHaveBeenCalledWith('session:s1', expect.any(Object), { ex: 30 * 86400 });
  });

  it('getSession returns null on miss', async () => {
    const s = await getSession('missing');
    expect(s).toBeNull();
  });
});
