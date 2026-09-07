import type { AIProvider, ChatEvent } from './provider';
import type { Intent, ConversationState } from './intent';
import type { InventoryClient } from '@/lib/inventory/client';
import { buildSystemPrompt } from './prompt';
import {
  executeSearchHotels, searchHotelsDefinition,
  executeGetHotelDetails, getHotelDetailsDefinition,
  executeGetRoomOptions, getRoomOptionsDefinition,
  executeGetAvailability, getAvailabilityDefinition,
  executeGetDestinationInfo, getDestinationInfoDefinition
} from './tools';
import type { Hotel } from '@/lib/inventory/types';

const TOOL_DEFS = [
  searchHotelsDefinition,
  getHotelDetailsDefinition,
  getRoomOptionsDefinition,
  getAvailabilityDefinition,
  getDestinationInfoDefinition
];

const TOOL_HANDLERS: Record<string, (input: unknown, client: InventoryClient) => Promise<unknown>> = {
  search_hotels: executeSearchHotels,
  get_hotel_details: executeGetHotelDetails,
  get_room_options: executeGetRoomOptions,
  get_availability: executeGetAvailability,
  get_destination_info: executeGetDestinationInfo
};

export type ToolLoopResult = {
  text: string;
  rankedHotels: Hotel[];
  toolCalls: number;
};

export async function runToolLoop(
  provider: AIProvider,
  intent: Intent,
  client: InventoryClient,
  onEvent: (e: ChatEvent) => void
): Promise<ToolLoopResult> {
  const state: ConversationState = {
    sessionId: 'inline',
    messages: [],
    extractedPreferences: intent,
    searchContext: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  let text = '';
  let toolCalls = 0;
  let rankedHotels: Hotel[] = [];

  for await (const event of provider.chat({
    messages: state.messages,
    system: buildSystemPrompt(intent),
    tools: TOOL_DEFS
  })) {
    onEvent(event);
    if (event.type === 'text_delta') {
      text += event.text;
    } else if (event.type === 'tool_use') {
      if (toolCalls >= 5) continue;
      toolCalls++;
      const handler = TOOL_HANDLERS[event.name];
      if (!handler) {
        onEvent({ type: 'error', message: `Unknown tool: ${event.name}` });
        continue;
      }
      try {
        const output = await handler(event.input, client);
        if (event.name === 'search_hotels' && Array.isArray(output)) {
          rankedHotels = output as Hotel[];
        }
        onEvent({ type: 'tool_result', name: event.name, output });
      } catch (err) {
        onEvent({ type: 'error', message: String(err) });
      }
    } else if (event.type === 'message_stop') {
      break;
    }
  }

  return { text, rankedHotels, toolCalls };
}
