import type { ConversationState, ChatMessage } from '@/lib/ai/intent';
import Anthropic from '@anthropic-ai/sdk';

const MAX_MESSAGES = 30;
const SUMMARIZE_MODEL = process.env.ANTHROPIC_EXTRACT_MODEL ?? 'claude-haiku-4-5';

export async function compressIfNeeded(state: ConversationState): Promise<ConversationState> {
  if (state.messages.length <= MAX_MESSAGES) return state;
  const headCount = 30;
  const recent = state.messages.slice(-headCount);
  const older = state.messages.slice(0, -headCount);
  const summary = await summarize(older);
  return {
    ...state,
    messages: [
      { role: 'system', content: `Conversation summary so far: ${summary}` },
      ...recent
    ]
  };
}

async function summarize(messages: ChatMessage[]): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return messages.map(m => `${m.role}: ${m.content}`).join(' | ').slice(0, 800);
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: SUMMARIZE_MODEL,
    max_tokens: 300,
    messages: [{ role: 'user', content: `Summarize this conversation for travel context, keeping destination, dates, and key preferences: ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}` }]
  });
  return (res.content[0] as any).text ?? '';
}
