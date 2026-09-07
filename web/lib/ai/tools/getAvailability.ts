import { getAvailabilitySchema } from './index';
import { InventoryClient } from '@/lib/inventory/client';

export const getAvailabilityDefinition = {
  name: 'get_availability',
  description: 'Search hotels with availability for specific check-in and check-out dates.',
  input_schema: {
    type: 'object',
    required: ['destination', 'checkIn', 'checkOut'],
    properties: {
      destination: { type: 'string' },
      checkIn: { type: 'string', description: 'YYYY-MM-DD' },
      checkOut: { type: 'string', description: 'YYYY-MM-DD' },
      guests: { type: 'integer' }
    }
  }
};

export async function executeGetAvailability(input: unknown, client: InventoryClient) {
  const parsed = getAvailabilitySchema.parse(input);
  const { hotels } = await client.getAvailability(parsed);
  return hotels;
}
