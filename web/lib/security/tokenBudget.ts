import { kv } from '@vercel/kv';

const LIMIT = 2_000_000;
const KEY = (() => {
  const d = new Date();
  return `tokens:${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
})();

export async function assertBudget(): Promise<void> {
  const used = (await kv.get<number>(KEY)) ?? 0;
  if (used > LIMIT) throw new Error('Daily token budget exceeded');
}

export async function recordUsage(tokens: number): Promise<void> {
  await kv.incrby(KEY, tokens);
  await kv.expire(KEY, 86400);
}
