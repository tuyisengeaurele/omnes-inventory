import Reveal from './Reveal';
import { DrawnIcon, type IconName } from './icons';

const FEATURES: { icon: IconName; name: string; line: string }[] = [
  {
    icon: 'warehouses',
    name: 'Warehouses',
    line: 'Live counts in every location, down to the bin.',
  },
  {
    icon: 'ledger',
    name: 'Movements ledger',
    line: 'Each change logged with who, when and why.',
  },
  {
    icon: 'transfers',
    name: 'Transfers',
    line: 'Warehouse to warehouse, with an in-transit state.',
  },
  {
    icon: 'purchasing',
    name: 'Purchase orders',
    line: 'Order, receive, reconcile. Partial deliveries covered.',
  },
  {
    icon: 'sales',
    name: 'Sales orders',
    line: 'Pick, pack and ship, stock updated at each step.',
  },
  {
    icon: 'expiry',
    name: 'Batch and expiry',
    line: 'Lot numbers and dates, oldest stock leaves first.',
  },
  {
    icon: 'counts',
    name: 'Stock counts',
    line: 'Count sessions with variance review before anything changes.',
  },
  {
    icon: 'alerts',
    name: 'Reorder alerts',
    line: 'Set a floor per product. Get told before you hit it.',
  },
  {
    icon: 'reports',
    name: 'Reports',
    line: 'Stock value, movement history, sales against purchases.',
  },
  {
    icon: 'barcode',
    name: 'Barcode labels',
    line: 'Generate, print and scan your own labels.',
  },
  {
    icon: 'team',
    name: 'Team roles',
    line: 'Owner to floor staff, each sees only their part.',
  },
  {
    icon: 'data',
    name: 'Import and export',
    line: 'Catalog in from CSV, your data out anytime.',
  },
];

export default function Features() {
  return (
    <section id="capabilities" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="microlabel mb-4">03 / Capabilities</p>
          <h2 className="font-display text-4xl font-semibold uppercase leading-none tracking-tight text-bone md:text-5xl">
            Built for the daily grind.
          </h2>
        </Reveal>
        <div className="rule mt-14 grid border-l border-t sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.name} delay={(i % 3) * 0.08}>
              <div className="rule group h-full border-b border-r p-6 transition-colors duration-300 hover:bg-raised/60">
                <DrawnIcon
                  name={f.icon}
                  className="h-6 w-6 text-teal transition-colors duration-300 group-hover:text-green"
                />
                <h3 className="mt-5 font-display text-xl font-medium uppercase tracking-wide text-bone">
                  {f.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-bone/55">{f.line}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
