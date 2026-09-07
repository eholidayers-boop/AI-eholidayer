import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Hotel } from '@/lib/inventory/types';

export function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <Card variant="bordered" className="overflow-hidden">
      <div className="relative h-48 -m-4 mb-4 bg-bg-subtle">
        {hotel.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={hotel.thumbnail} alt={hotel.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <h3 className="font-display text-xl text-fg">{hotel.name}</h3>
      <p className="text-sm text-fg-muted">{hotel.destination.name}, {hotel.destination.country}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-sm">★ {hotel.rating}</span>
        <Badge variant="status" size="sm">{hotel.category}-star</Badge>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-fg-muted">from</p>
          <p className="font-mono text-lg">${hotel.priceFrom.amount}</p>
        </div>
        <Link href={`/hotels/${hotel.slug || hotel.id}`} className="text-sm text-accent hover:underline">
          View →
        </Link>
      </div>
    </Card>
  );
}
