import { AIHeroInput } from '@/components/composite/AIHeroInput';

const TRUST_TILES = [
  'Personalized recommendations',
  'Transparent prices',
  'Real hotel availability',
  'Human support when you need it'
];

export default function HomePage() {
  return (
    <main>
      <header className="mx-auto flex max-w-7xl items-center justify-between p-6">
        <span className="font-display text-2xl text-fg">eHolidayer</span>
        <nav className="flex gap-6 text-sm text-fg-muted">
          <a href="#" className="hover:text-fg">Explore</a>
          <a href="#" className="hover:text-fg">My Trips</a>
          <a href="#" className="hover:text-fg">Login</a>
          <span>EN / USD</span>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden bg-fg text-bg">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-fg to-bg-subtle opacity-90" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h1 className="font-display text-5xl md:text-6xl tracking-tight">
            Tell me what kind of stay you're looking for.
          </h1>
          <p className="mt-4 text-lg text-bg/80">
            I'll find the hotels that fit you best.
          </p>
          <div className="mt-10">
            <AIHeroInput />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-fg-muted">
          {TRUST_TILES.map((t) => (
            <li key={t} className="rounded-lg border border-border p-4 bg-bg">{t}</li>
          ))}
        </ul>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-8 text-sm text-fg-muted">
        © eHolidayer
      </footer>
    </main>
  );
}
