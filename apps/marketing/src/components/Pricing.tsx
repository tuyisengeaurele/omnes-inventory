import Reveal from './Reveal';

const REPO = 'https://github.com/tuyisengeaurele/omnes-inventory';

const TIERS = [
  {
    name: 'Starter',
    price: '0',
    per: 'free while you fit',
    items: ['1 warehouse', '500 products', '2 team members', 'Movements ledger'],
    highlight: false,
  },
  {
    name: 'Growth',
    price: '29',
    per: 'per month',
    items: ['5 warehouses', '10,000 products', '10 team members', 'Purchase orders', 'CSV import and export'],
    highlight: true,
  },
  {
    name: 'Scale',
    price: '79',
    per: 'per month',
    items: ['Unlimited warehouses', 'Unlimited products', 'Unlimited team', 'Batch and expiry tracking', 'Full audit log'],
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="microlabel mb-4">04 / Pricing</p>
          <h2 className="font-display text-4xl font-semibold uppercase leading-none tracking-tight text-bone md:text-5xl">
            Priced by shelf, not by seat squeeze.
          </h2>
          <p className="mt-4 max-w-md text-bone/60">
            The app is still in development, so these tiers are a preview. Numbers may move
            before launch.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <div
                className={`rounded-lg border p-6 transition-transform duration-300 hover:-translate-y-1 ${
                  t.highlight ? 'border-teal/40 bg-raised' : 'rule bg-raised/50'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl font-medium uppercase tracking-wide text-bone">
                    {t.name}
                  </h3>
                  {t.highlight && <span className="microlabel text-teal">Most teams</span>}
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-semibold text-bone">${t.price}</span>
                  <span className="font-mono text-xs text-bone/40">{t.per}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {t.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-bone/70">
                      <span className={`h-1 w-3 ${t.highlight ? 'bg-teal' : 'bg-bone/20'}`} />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={REPO}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-8 block rounded px-4 py-2.5 text-center text-sm font-medium transition-all ${
                    t.highlight
                      ? 'bg-blue text-bone hover:brightness-110'
                      : 'rule border text-bone/70 hover:border-bone/30 hover:text-bone'
                  }`}
                >
                  Follow the build
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
