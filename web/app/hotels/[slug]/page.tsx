import { notFound } from 'next/navigation';
import { InventoryClient } from '@/lib/inventory/client';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 21600;

async function getClient() {
  return new InventoryClient(process.env.LEGACY_API_BASE_URL!, process.env.LEGACY_API_TOKEN!);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClient();
  const { hotels } = await client.searchHotels({ pageSize: 1 });
  const id = hotels[0]?.id; // First hotel lookup; refined in sub-project 2
  if (!id) return {};
  const { hotel } = await client.getHotelDetails(id);
  return { title: `${hotel.name} — eHolidayer`, description: hotel.description.slice(0, 160) };
}

export default async function HotelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClient();
  const { hotels } = await client.searchHotels({ pageSize: 50 });
  const hotel = hotels.find(h => (h.slug || h.id) === slug);
  if (!hotel) notFound();
  const [detail, { rooms }, { reviews }] = await Promise.all([
    client.getHotelDetails(hotel.id),
    client.getRoomOptions(hotel.id),
    client.getReviews({ hotelId: hotel.id })
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl">{detail.hotel.name}</h1>
      <p className="text-fg-muted mb-6">{detail.hotel.destination.name}, {detail.hotel.destination.country} · <Badge>{detail.hotel.category}-star</Badge></p>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {detail.hotel.photos.slice(0, 6).map((p, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={i} src={p} alt="" className="h-48 w-full object-cover rounded-md bg-bg-subtle" />
        ))}
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl mb-3">About</h2>
        <p className="text-fg-muted max-w-2xl">{detail.hotel.description}</p>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl mb-3">Rooms</h2>
        <ul className="space-y-3">
          {rooms.map(r => (
            <li key={r.id} className="flex items-center justify-between border border-border rounded-md p-4">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-fg-muted">{r.boardType.replace('_', ' ')} · sleeps {r.capacity.adults + r.capacity.children}</p>
              </div>
              <div className="text-right">
                <p className="font-mono">${r.price.amount}</p>
                <p className="text-xs text-fg-muted">{r.refundable ? 'Refundable' : 'Non-refundable'}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-3">Reviews ({reviews.length})</h2>
        <ul className="space-y-3">
          {reviews.map(r => (
            <li key={r.id} className="border border-border rounded-md p-4">
              <p className="font-medium">★ {r.rating} — {r.title}</p>
              <p className="text-fg-muted text-sm">{r.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
