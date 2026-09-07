export type Price = { amount: number; currency: string };

export type Destination = {
  id: string;
  name: string;
  country: string;
};

export type Hotel = {
  id: string;
  slug: string;
  name: string;
  destination: Destination;
  category: number;
  rating: number;
  reviewCount: number;
  priceFrom: Price;
  thumbnail: string;
  amenities: string[];
  beachDistance?: number | null;
};

export type RoomOption = {
  id: string;
  name: string;
  capacity: { adults: number; children: number };
  boardType: 'room_only' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
  refundable: boolean;
  cancellationDeadline?: string | null;
  price: Price;
};

export type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  createdAt: string;
};

export type HotelDetail = Hotel & {
  description: string;
  photos: string[];
  rooms: RoomOption[];
  reviews: { rating: number; count: number; recent: Review[] };
  location: { lat: number; lng: number; address: string };
  policies: { cancellation: string; checkIn: string; checkOut: string };
};

export type AvailabilityResult = {
  hotelId: string;
  name: string;
  minPrice: Price;
};

export type User = {
  id: string;
  email: string;
  role: 'user' | 'hotelier' | 'admin';
};

export type SearchQuery = {
  destination?: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
};

export type AvailabilityQuery = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
};
