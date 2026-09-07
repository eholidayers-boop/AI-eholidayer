import { kv } from '@vercel/kv';

export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const hit = await kv.get<T>(key);
  if (hit !== null && hit !== undefined) return hit;
  const fresh = await fn();
  await kv.set(key, fresh, { ex: ttlSeconds });
  return fresh;
}
