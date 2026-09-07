import { getDestinationInfoSchema } from './index';
import { InventoryClient } from '@/lib/inventory/client';

export const getDestinationInfoDefinition = {
  name: 'get_destination_info',
  description: 'Look up basic information about a destination (e.g., a Hurghada summary).',
  input_schema: {
    type: 'object',
    required: ['destination'],
    properties: { destination: { type: 'string' } }
  }
};

export async function executeGetDestinationInfo(input: unknown, client: InventoryClient) {
  const parsed = getDestinationInfoSchema.parse(input);
  const { destinations } = await client.getDestinations();
  const match = destinations.find(d => d.name.toLowerCase().includes(parsed.destination.toLowerCase()));
  return match ?? { error: 'destination_not_found' };
}
