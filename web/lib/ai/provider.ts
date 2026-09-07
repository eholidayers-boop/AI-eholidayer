import type { ChatMessage } from './intent';

export type ChatInput = {
  messages: ChatMessage[];
  system?: string;
  tools?: unknown[];
  maxTokens?: number;
  temperature?: number;
};

export type ChatEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_use'; name: string; input: unknown }
  | { type: 'tool_result'; name: string; output: unknown }
  | { type: 'message_stop'; reason: string }
  | { type: 'error'; message: string };

export interface AIProvider {
  chat(input: ChatInput): AsyncIterable<ChatEvent>;
  extractIntent(messages: ChatMessage[]): Promise<import('./intent').Intent>;
}
