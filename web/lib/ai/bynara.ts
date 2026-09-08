import type { AIProvider, ChatInput, ChatEvent } from './provider';
import type { ChatMessage, Intent } from './intent';

const BASE_URL = process.env.BYNARA_BASE_URL ?? 'https://router.bynara.id/v1';
const CHAT_MODEL = process.env.BYNARA_CHAT_MODEL ?? 'laguna-s-2.1';
const EXTRACT_MODEL = process.env.BYNARA_EXTRACT_MODEL ?? 'longcat-2.0-free';

export class BynaraProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async *chat(input: ChatInput): AsyncIterable<ChatEvent> {
    const { assertBudget } = await import('@/lib/security/tokenBudget');
    await assertBudget();
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: input.maxTokens ?? 1024,
        temperature: input.temperature,
        messages: [
          ...(input.system ? [{ role: 'system', content: input.system }] : []),
          ...input.messages.map(m => ({ role: m.role, content: m.content }))
        ],
        tools: input.tools ?? undefined,
        stream: true
      })
    });

    if (!res.ok || !res.body) {
      yield { type: 'error', message: `bynara chat error ${res.status}` };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        for (const line of part.split('\n')) {
          const data = line.replace(/^data: /, '').trim();
          if (!data || data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            if (json.error) {
              yield { type: 'error', message: json.error.message ?? 'bynara error' };
              return;
            }
            const delta = json.choices?.[0]?.delta;
            if (delta?.content) {
              yield { type: 'text_delta', text: delta.content };
            } else if (delta?.tool_calls?.[0]) {
              const tc = delta.tool_calls[0];
              if (tc.function?.name) {
                yield { type: 'tool_use', name: tc.function.name, input: JSON.parse(tc.function.arguments ?? '{}') };
              }
            } else if (json.choices?.[0]?.finish_reason === 'stop') {
              yield { type: 'message_stop', reason: 'end_turn' };
            }
          } catch {
            // skip malformed SSE frame
          }
        }
      }
    }
    const { recordUsage } = await import('@/lib/security/tokenBudget');
    const inputLen = input.messages.reduce((n, m) => n + m.content.length, 0) + (input.system?.length ?? 0);
    await recordUsage(Math.ceil(inputLen / 4) + 1024);
  }

  async extractIntent(messages: ChatMessage[]): Promise<Intent> {
    const last = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
    const prompt = `Extract structured travel preferences from this user message. Return JSON only with these fields (omit any not present): destination, dates.checkIn, dates.checkOut, guests.adults, guests.children, guests.rooms, budget.amount, budget.currency, softPreferences.<beach|cleanliness|food|luxury|romantic|family|nightlife|business|quiet|value> as 0-10 ints, context as one of family|couple|business|solo|group.\n\nMessage: ${last}`;
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({
        model: EXTRACT_MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      })
    });
    if (!res.ok) return {};
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content ?? '{}';
    const cleaned = text.replace(/^```json\n?|```$/g, '').trim();
    try {
      return JSON.parse(cleaned) as Intent;
    } catch {
      return {};
    }
  }
}
