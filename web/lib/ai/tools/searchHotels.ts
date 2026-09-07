import { searchHotelsSchema } from './index';
import { InventoryClient } from '@/lib/inventory/client';

export const searchHotelsDefinition = {
  name: 'search_hotels',
  description: 'Search hotels by destination, category, or price. Use when the user expresses a destination or wants to discover stays.',
  input_schema: {
    type: 'object',
    properties: {
      destination: { type: 'string', description: 'City or region name' },
      query: { type: 'string', description: 'Free-text search' },
      category: { type: 'integer', minimum: 1, maximum: 5 },
      maxPrice: { type: 'integer', description: 'Max nightly price in USD' },
      limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 }
    }
  }
};

export async function executeSearchHotels(input: unknown, client: InventoryClient) {
  const parsed = searchHotelsSchema.parse(input);
  const result = await client.searchHotels({
    destination: parsed.destination,
    category: parsed.category,
    maxPrice: parsed.maxPrice,
    pageSize: parsed.limit
  });
  return result.hotels;
}
