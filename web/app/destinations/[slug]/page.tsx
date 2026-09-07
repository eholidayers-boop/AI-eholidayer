import { notFound } from 'next/navigation';
import { InventoryClient } from '@/lib/inventory/client';
import { HotelCard } from '@/components/composite/HotelCard';

export const revalidate = 21600; // 6h ISR

async function getClient() {
  return new InventoryClient(
    process.env.LEGACY_API_BASE_URL!,
    process.env.LEGACY_API_TOKEN!
  );
}

export async function generateStaticParams() {
  const client = await getClient();
  const { destinations } = await client.getDestinations();
  return destinations.map(d => ({ slug: slugify(d.name) }));
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClient();
  const { destinations } = await client.getDestinations();
  const dest = destinations.find(d => slugify(d.name) === slug);
  if (!dest) return {};
  return {
    title: `Hotels in ${dest.name}, ${dest.country} — eHolidayer`,
    description: `Find the best hotels in ${dest.name}. Personalized recommendations, transparent prices, real availability.`,
    alternates: { canonical: `https://www.eholidayer.com/destinations/${slug}` }
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClient();
  const { destinations } = await client.getDestinations();
  const dest = destinations.find(d => slugify(d.name) === slug);
  if (!dest) notFound();

  const { hotels } = await client.searchHotels({ destination: dest.id, pageSize: 24 });

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl mb-2">Hotels in {dest.name}</h1>
      <p className="text-fg-muted mb-8">{dest.country} · {hotels.length} stays</p>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map(h => (
          <li key={h.id}><HotelCard hotel={h} /></li>
        ))}
      </ul>
    </main>
  );
}
