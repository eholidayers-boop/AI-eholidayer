import { getHotelDetailsSchema } from './index';
import { InventoryClient } from '@/lib/inventory/client';

export const getHotelDetailsDefinition = {
  name: 'get_hotel_details',
  description: 'Get full details (description, photos, location, policies) for a specific hotel by id.',
  input_schema: {
    type: 'object',
    required: ['hotelId'],
    properties: { hotelId: { type: 'string' } }
  }
};

export async function executeGetHotelDetails(input: unknown, client: InventoryClient) {
  const parsed = getHotelDetailsSchema.parse(input);
  const { hotel } = await client.getHotelDetails(parsed.hotelId);
  return hotel;
}
