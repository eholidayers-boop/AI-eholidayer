import { getRoomOptionsSchema } from './index';
import { InventoryClient } from '@/lib/inventory/client';

export const getRoomOptionsDefinition = {
  name: 'get_room_options',
  description: 'List room options (board, price, refundability) for a specific hotel.',
  input_schema: {
    type: 'object',
    required: ['hotelId'],
    properties: { hotelId: { type: 'string' } }
  }
};

export async function executeGetRoomOptions(input: unknown, client: InventoryClient) {
  const parsed = getRoomOptionsSchema.parse(input);
  const { rooms } = await client.getRoomOptions(parsed.hotelId);
  return rooms;
}
