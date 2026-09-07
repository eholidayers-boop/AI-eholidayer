import { kv } from '@vercel/kv';

const LIMIT = 20;
const WINDOW = 60; // seconds

export async function rateLimit(key: string): Promise<boolean> {
  const bucket = `rl:${key}`;
  const count = await kv.incr(bucket);
  if (count === 1) await kv.expire(bucket, WINDOW);
  return count <= LIMIT;
}
