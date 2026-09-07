import type { Price } from '@/lib/inventory/types';

export function PriceBreakdown({ rate, taxes, fees, total, currency }: { rate: number; taxes: number; fees: number; total: number; currency: string }) {
  const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;
  return (
    <dl className="text-sm">
      <div className="flex justify-between"><dt>Rate</dt><dd className="font-mono">{fmt(rate)}</dd></div>
      <div className="flex justify-between"><dt>Taxes</dt><dd className="font-mono">{fmt(taxes)}</dd></div>
      <div className="flex justify-between"><dt>Fees</dt><dd className="font-mono">{fmt(fees)}</dd></div>
      <div className="flex justify-between border-t border-border mt-2 pt-2 font-medium"><dt>Total</dt><dd className="font-mono">{fmt(total)}</dd></div>
    </dl>
  );
}
