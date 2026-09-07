import Link from 'next/link';
import { InventoryClient } from '@/lib/inventory/client';

export const revalidate = 86400;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const metadata = { title: 'Destinations — eHolidayer' };

export default async function DestinationsIndex() {
  const client = new InventoryClient(process.env.LEGACY_API_BASE_URL!, process.env.LEGACY_API_TOKEN!);
  const { destinations } = await client.getDestinations();
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl mb-8">Destinations</h1>
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {destinations.map(d => (
          <li key={d.id}>
            <Link href={`/destinations/${slugify(d.name)}`} className="block rounded-md border border-border p-4 hover:border-accent">
              <p className="font-medium">{d.name}</p>
              <p className="text-sm text-fg-muted">{d.country}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
