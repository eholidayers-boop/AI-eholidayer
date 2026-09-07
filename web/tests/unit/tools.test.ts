import { describe, it, expect } from 'vitest';
import { searchHotelsSchema, getHotelDetailsSchema, getAvailabilitySchema } from '@/lib/ai/tools';

describe('tool schemas', () => {
  it('searchHotels accepts empty input with defaults', () => {
    const parsed = searchHotelsSchema.parse({});
    expect(parsed.limit).toBe(10);
  });

  it('getHotelDetails requires hotelId', () => {
    expect(() => getHotelDetailsSchema.parse({})).toThrow();
  });

  it('getAvailability requires dates and destination', () => {
    expect(() => getAvailabilitySchema.parse({ destination: 'X' })).toThrow();
  });
});
