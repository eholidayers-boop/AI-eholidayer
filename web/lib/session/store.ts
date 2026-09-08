import { kv } from '@vercel/kv';
import type { ConversationState } from '@/lib/ai/intent';

const TTL_SECONDS = 30 * 86400;

function kvAvailable(): boolean {
  return Boolean(process.env.KV_REST_API_URL);
}

export async function getSession(id: string): Promise<ConversationState | null> {
  if (!kvAvailable()) return null;
  const v = await kv.get<ConversationState>(`session:${id}`);
  return v ?? null;
}

export async function saveSession(state: ConversationState): Promise<void> {
  if (!kvAvailable()) return;
  state.updatedAt = new Date().toISOString();
  await kv.set(`session:${state.sessionId}`, state, { ex: TTL_SECONDS });
}
