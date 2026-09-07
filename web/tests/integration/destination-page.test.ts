import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DestinationPage from '@/app/destinations/[slug]/page';

vi.mock('@/lib/inventory/client', () => ({
  InventoryClient: class { constructor(_a: any, _b: any) {} async getDestinations() { return { destinations: [{ id: '7', name: 'Hurghada', country: 'EG' }] }; } async searchHotels(q: any) { return { hotels: [{ id: '1', slug: 'azure', name: 'Azure Bay', destination: { id: '7', name: 'Hurghada', country: 'EG' }, category: 5, rating: 9.1, reviewCount: 100, priceFrom: { amount: 540, currency: 'USD' }, thumbnail: '', amenities: [] }], total: 1, page: 1 }; } }
}));

describe('DestinationPage', () => {
  it('renders hotel name and destination', async () => {
    const Page = await DestinationPage({ params: Promise.resolve({ slug: 'hurghada' }) });
    render(Page as any);
    expect(screen.getByText(/Hurghada/)).toBeInTheDocument();
    expect(screen.getByText(/Azure Bay/)).toBeInTheDocument();
  });
});
