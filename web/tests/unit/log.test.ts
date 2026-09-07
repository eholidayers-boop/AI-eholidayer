import { describe, it, expect, vi } from 'vitest';
import { logEvent, logError } from '@/lib/analytics/server';

describe('analytics/server', () => {
  it('logEvent writes JSON line with ts', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logEvent('chat_started', { sessionId: 's1' });
    expect(spy).toHaveBeenCalled();
    const arg = (spy.mock.calls[0] as any)[0];
    expect(arg).toContain('"event":"chat_started"');
    expect(arg).toContain('"sessionId":"s1"');
  });

  it('logError includes stack and context', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('boom');
    logError(err, { route: '/x' });
    const arg = (spy.mock.calls[0] as any)[0];
    expect(arg).toContain('"route":"/x"');
    expect(arg).toContain('boom');
  });
});
