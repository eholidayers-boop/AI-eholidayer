import { kv } from '@vercel/kv';

const LIMIT = 20;
const WINDOW = 60; // seconds

function kvAvailable(): boolean {
  return Boolean(process.env.KV_REST_API_URL);
}

export async function rateLimit(key: string): Promise<boolean> {
  if (!kvAvailable()) return true;
  const bucket = `rl:${key}`;
  const count = await kv.incr(bucket);
  if (count === 1) await kv.expire(bucket, WINDOW);
  return count <= LIMIT;
}
