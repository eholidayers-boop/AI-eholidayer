import { InventoryClient } from '@/lib/inventory/client';
import { HotelCard } from '@/components/composite/HotelCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Search hotels — eHolidayer' };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const destination = typeof params.destination === 'string' ? params.destination : undefined;
  const maxPrice = typeof params.maxPrice === 'string' ? Number(params.maxPrice) : undefined;
  const category = typeof params.category === 'string' ? Number(params.category) : undefined;

  const client = new InventoryClient(process.env.LEGACY_API_BASE_URL!, process.env.LEGACY_API_TOKEN!);
  const { destinations } = await client.getDestinations();
  const { hotels } = await client.searchHotels({ destination, category, maxPrice, pageSize: 30 });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
      <aside>
        <h2 className="font-display text-xl mb-3">Filters</h2>
        <form className="space-y-4">
          <label className="block">
            <span className="text-sm text-fg-muted">Destination</span>
            <select name="destination" defaultValue={destination ?? ''} className="mt-1 w-full rounded-md border border-border bg-bg p-2">
              <option value="">Any</option>
              {destinations.map(d => <option key={d.id} value={d.id}>{d.name}, {d.country}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-fg-muted">Max price (USD)</span>
            <input name="maxPrice" type="number" defaultValue={maxPrice ?? ''} className="mt-1 w-full rounded-md border border-border bg-bg p-2" />
          </label>
          <label className="block">
            <span className="text-sm text-fg-muted">Min star rating</span>
            <select name="category" defaultValue={category ?? ''} className="mt-1 w-full rounded-md border border-border bg-bg p-2">
              <option value="">Any</option>
              {[3, 4, 5].map(c => <option key={c} value={c}>{c}+</option>)}
            </select>
          </label>
          <button type="submit" className="w-full bg-accent text-bg rounded-md py-2">Apply</button>
        </form>
      </aside>
      <section>
        <h1 className="font-display text-3xl mb-6">{hotels.length} stays</h1>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map(h => <li key={h.id}><HotelCard hotel={h} /></li>)}
        </ul>
      </section>
    </main>
  );
}
