export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-12 text-fg-muted">
      <p className="font-display text-2xl text-fg mb-2">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}
