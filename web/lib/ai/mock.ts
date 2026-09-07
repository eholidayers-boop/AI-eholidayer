import type { AIProvider, ChatInput, ChatEvent } from './provider';
import type { ChatMessage, Intent } from './intent';
import scripts from '@/tests/fixtures/scripts.json';

const SCRIPT = scripts as Array<{
  match: string;
  reply: string;
  tool?: { name: string; input: unknown };
  intent?: Intent;
}>;

function findScript(text: string) {
  for (const s of SCRIPT) {
    if (new RegExp(s.match, 'i').test(text)) return s;
  }
  return SCRIPT[SCRIPT.length - 1];
}

export class MockProvider implements AIProvider {
  async *chat(input: ChatInput): AsyncIterable<ChatEvent> {
    const last = [...input.messages].reverse().find(m => m.role === 'user');
    const text = last?.content ?? '';
    const s = findScript(text);
    yield { type: 'text_delta', text: s.reply };
    if (s.tool) yield { type: 'tool_use', name: s.tool.name, input: s.tool.input };
    yield { type: 'message_stop', reason: 'end_turn' };
  }

  async extractIntent(messages: ChatMessage[]): Promise<Intent> {
    const last = [...messages].reverse().find(m => m.role === 'user');
    const text = last?.content ?? '';
    return findScript(text).intent ?? {};
  }
}
