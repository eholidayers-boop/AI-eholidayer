import { kv } from '@vercel/kv';

const LIMIT = 2_000_000;
const KEY = (() => {
  const d = new Date();
  return `tokens:${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
})();

function kvAvailable(): boolean {
  return Boolean(process.env.KV_REST_API_URL);
}

export async function assertBudget(): Promise<void> {
  if (!kvAvailable()) return;
  const used = (await kv.get<number>(KEY)) ?? 0;
  if (used > LIMIT) throw new Error('Daily token budget exceeded');
}

export async function recordUsage(tokens: number): Promise<void> {
  if (!kvAvailable()) return;
  await kv.incrby(KEY, tokens);
  await kv.expire(KEY, 86400);
}
