import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, ChatInput, ChatEvent } from './provider';
import type { ChatMessage, Intent } from './intent';

const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL ?? 'claude-sonnet-5';
const EXTRACT_MODEL = process.env.ANTHROPIC_EXTRACT_MODEL ?? 'claude-haiku-4-5';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *chat(input: ChatInput): AsyncIterable<ChatEvent> {
    const { assertBudget } = await import('@/lib/security/tokenBudget');
    await assertBudget();
    const stream = this.client.messages.stream({
      model: CHAT_MODEL,
      max_tokens: input.maxTokens ?? 1024,
      temperature: input.temperature,
      system: input.system,
      messages: input.messages.map(m => ({ role: m.role, content: m.content })),
      tools: input.tools
    } as any);

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text_delta', text: (event.delta as any).text };
      } else if (event.type === 'message_stop') {
        yield { type: 'message_stop', reason: 'end_turn' };
      }
    }
    const { recordUsage } = await import('@/lib/security/tokenBudget');
    const inputLen = input.messages.reduce((n, m) => n + m.content.length, 0) + (input.system?.length ?? 0);
    await recordUsage(Math.ceil(inputLen / 4) + 1024);
  }

  async extractIntent(messages: ChatMessage[]): Promise<Intent> {
    const last = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
    const prompt = `Extract structured travel preferences from this user message. Return JSON only with these fields (omit any not present): destination, dates.checkIn, dates.checkOut, guests.adults, guests.children, guests.rooms, budget.amount, budget.currency, softPreferences.<beach|cleanliness|food|luxury|romantic|family|nightlife|business|quiet|value> as 0-10 ints, context as one of family|couple|business|solo|group.\n\nMessage: ${last}`;
    const res = await this.client.messages.create({
      model: EXTRACT_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });
    const text = (res.content[0] as any).text ?? '{}';
    const cleaned = text.replace(/^```json\n?|```$/g, '').trim();
    try {
      return JSON.parse(cleaned) as Intent;
    } catch {
      return {};
    }
  }
}
