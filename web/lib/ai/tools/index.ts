import { z } from 'zod';

export const searchHotelsSchema = z.object({
  destination: z.string().optional(),
  query: z.string().optional(),
  category: z.number().int().min(1).max(5).optional(),
  maxPrice: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(20).default(10)
});

export const getHotelDetailsSchema = z.object({ hotelId: z.string() });
export const getRoomOptionsSchema = z.object({ hotelId: z.string() });
export const getAvailabilitySchema = z.object({
  destination: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number().int().positive().optional()
});
export const getDestinationInfoSchema = z.object({ destination: z.string() });

export type SearchHotelsInput = z.infer<typeof searchHotelsSchema>;
export type GetHotelDetailsInput = z.infer<typeof getHotelDetailsSchema>;
export type GetRoomOptionsInput = z.infer<typeof getRoomOptionsSchema>;
export type GetAvailabilityInput = z.infer<typeof getAvailabilitySchema>;
export type GetDestinationInfoInput = z.infer<typeof getDestinationInfoSchema>;
