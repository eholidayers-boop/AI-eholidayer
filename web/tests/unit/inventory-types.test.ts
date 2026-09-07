import { describe, it, expectTypeOf } from 'vitest';
import type { Hotel, HotelDetail, RoomOption, Review, Destination } from '@/lib/inventory/types';

describe('inventory types', () => {
  it('Hotel has required fields', () => {
    expectTypeOf<Hotel>().toHaveProperty('id');
    expectTypeOf<Hotel>().toHaveProperty('priceFrom');
    expectTypeOf<Hotel>().toHaveProperty('destination');
  });

  it('HotelDetail extends Hotel with rooms and photos', () => {
    expectTypeOf<HotelDetail>().toMatchTypeOf<Hotel>();
    expectTypeOf<HotelDetail['rooms']>().toEqualTypeOf<RoomOption[]>();
  });

  it('Review has rating and body', () => {
    expectTypeOf<Review>().toHaveProperty('rating');
    expectTypeOf<Review>().toHaveProperty('body');
  });
});
