import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HotelPage from '@/app/hotels/[slug]/page';

vi.mock('@/lib/inventory/client', () => ({
  InventoryClient: class {
    async getHotelDetails(id: string) { return { hotel: { id, slug: 'azure', name: 'Azure Bay', destination: { id: '7', name: 'H', country: 'EG' }, category: 5, rating: 9.1, reviewCount: 100, priceFrom: { amount: 540, currency: 'USD' }, thumbnail: '', amenities: ['pool'], description: 'A nice resort.', photos: [], rooms: [], reviews: { rating: 9.1, count: 100, recent: [] }, location: { lat: 0, lng: 0, address: '' }, policies: { cancellation: 'Free 24h', checkIn: '14:00', checkOut: '12:00' } } }; }
    async getRoomOptions(id: string) { return { rooms: [{ id: 'r1', name: 'Standard', capacity: { adults: 2, children: 0 }, boardType: 'breakfast', refundable: true, price: { amount: 540, currency: 'USD' } }] }; }
    async getReviews(f: any) { return { reviews: [] }; }
  }
}));

describe('HotelPage', () => {
  it('renders hotel name and a room option', async () => {
    const Page = await HotelPage({ params: Promise.resolve({ slug: 'azure' }) });
    render(Page as any);
    expect(screen.getByText('Azure Bay')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
  });
});
