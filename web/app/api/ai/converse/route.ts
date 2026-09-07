import { NextRequest } from 'next/server';
import { AnthropicProvider } from '@/lib/ai/anthropic';
import { MockProvider } from '@/lib/ai/mock';
import { runToolLoop, type ToolLoopResult } from '@/lib/ai/toolLoop';
import { getSession, saveSession } from '@/lib/session/store';
import { compressIfNeeded } from '@/lib/session/compress';
import { InventoryClient } from '@/lib/inventory/client';
import type { AIProvider, ChatEvent } from '@/lib/ai/provider';
import type { ConversationState } from '@/lib/ai/intent';
import { rateLimit } from '@/lib/security/rateLimit';

export const runtime = 'nodejs';

function pickProvider(): AIProvider {
  const useMock = process.env.AI_PROVIDER === 'mock'
    && (process.env.ALLOW_MOCK_PROVIDER === 'true' || process.env.NODE_ENV !== 'production');
  if (useMock) return new MockProvider();
  if (!process.env.ANTHROPIC_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ANTHROPIC_API_KEY required in production');
    }
    return new MockProvider();
  }
  return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
}

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { sessionId?: string; message: string };
  if (!body.message?.trim()) {
    return new Response(JSON.stringify({ error: 'message_required' }), { status: 400 });
  }
  const sessionId = body.sessionId ?? crypto.randomUUID();
  const sessionKey = body.sessionId ?? 'anon';
  if (!(await rateLimit(sessionKey))) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
  }
  const provider = pickProvider();
  const client = new InventoryClient(
    process.env.LEGACY_API_BASE_URL!,
    process.env.LEGACY_API_TOKEN!
  );

  let state: ConversationState = (await getSession(sessionId)) ?? {
    sessionId,
    messages: [],
    extractedPreferences: {},
    searchContext: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.messages.push({ role: 'user', content: body.message });
  state.extractedPreferences = { ...state.extractedPreferences, ...(await provider.extractIntent(state.messages)) };
  state = await compressIfNeeded(state);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sseEncode(event, data)));
      send('session', { sessionId });

      let result: ToolLoopResult = { text: '', rankedHotels: [], toolCalls: 0 };
      try {
        result = await runToolLoop(provider, state.extractedPreferences, client, (e: ChatEvent) => {
          if (e.type === 'text_delta') send('text_delta', { text: e.text });
          else if (e.type === 'tool_use') send('tool_use', { name: e.name, input: e.input });
          else if (e.type === 'tool_result') send('tool_result', { name: e.name, output: e.output });
          else if (e.type === 'error') send('error', { message: e.message });
        });
      } catch (err) {
        send('error', { message: String(err) });
      }

      state.messages.push({ role: 'assistant', content: result.text });
      state.searchContext.lastResults = result.rankedHotels.length
        ? { hotelIds: result.rankedHotels.map(h => h.id), rankedAt: new Date().toISOString() }
        : state.searchContext.lastResults;
      await saveSession(state);

      send('hotels', { hotels: result.rankedHotels });
      send('done', { sessionId, toolCalls: result.toolCalls });
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
