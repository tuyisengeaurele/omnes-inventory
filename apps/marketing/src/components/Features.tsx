import Reveal from './Reveal';

const FEATURES = [
  {
    n: '01',
    name: 'Multi-warehouse',
    line: 'Stock per product, per warehouse, per bin. Transfers with an in-transit state.',
  },
  {
    n: '02',
    name: 'Movements ledger',
    line: 'Every change is a timestamped entry with an author. Nothing edits history.',
  },
  {
    n: '03',
    name: 'Purchase orders',
    line: 'Draft, send, receive. Partial deliveries land without spreadsheet math.',
  },
  {
    n: '04',
    name: 'Reorder alerts',
    line: 'Set a reorder point per product per warehouse. Omnes flags the shelf before it empties.',
  },
];

export default function Features() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="microlabel mb-4">03 / Capabilities</p>
          <h2 className="font-display text-4xl font-semibold uppercase leading-none tracking-tight text-bone md:text-5xl">
            Built for the daily grind.
          </h2>
        </Reveal>
        <div className="rule mt-14 border-t">
          {FEATURES.map((f, i) => (
            <Reveal key={f.n} delay={i * 0.08}>
              <div className="rule group grid gap-2 border-b py-7 transition-colors hover:bg-raised/50 md:grid-cols-[80px_240px_1fr] md:items-baseline md:gap-6 md:px-4">
                <span className="font-mono text-xs text-bone/30">{f.n}</span>
                <h3 className="font-display text-2xl font-medium uppercase tracking-wide text-bone transition-colors group-hover:text-teal">
                  {f.name}
                </h3>
                <p className="text-bone/60">{f.line}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
