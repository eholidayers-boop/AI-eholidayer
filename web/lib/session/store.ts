import { kv } from '@vercel/kv';
import type { ConversationState } from '@/lib/ai/intent';

const TTL_SECONDS = 30 * 86400;

export async function getSession(id: string): Promise<ConversationState | null> {
  const v = await kv.get<ConversationState>(`session:${id}`);
  return v ?? null;
}

export async function saveSession(state: ConversationState): Promise<void> {
  state.updatedAt = new Date().toISOString();
  await kv.set(`session:${state.sessionId}`, state, { ex: TTL_SECONDS });
}
