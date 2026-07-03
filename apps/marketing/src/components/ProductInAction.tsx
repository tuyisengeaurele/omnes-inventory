import Reveal from './Reveal';

// hand built mockups of the actual app screens, not screenshots,
// so they stay sharp at every size and inherit the theme

const ROWS = [
  { sku: 'OMN-0042', name: 'Steel shelf bracket', kgl: 132, msz: 87, hye: 214, low: false },
  { sku: 'OMN-1107', name: 'Pallet wrap 500m', kgl: 41, msz: 118, hye: 96, low: false },
  { sku: 'OMN-0311', name: 'Label roll 58mm', kgl: 12, msz: 9, hye: 30, low: true },
  { sku: 'OMN-2280', name: 'Packing tape, clear', kgl: 220, msz: 164, hye: 88, low: false },
  { sku: 'OMN-0958', name: 'Corner protector', kgl: 18, msz: 260, hye: 74, low: true },
];

export default function ProductInAction() {
  return (
    <section id="product" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="microlabel mb-4">02 / The product</p>
          <h2 className="max-w-xl font-display text-4xl font-semibold uppercase leading-none tracking-tight text-bone md:text-5xl">
            The whole floor on one screen.
          </h2>
        </Reveal>

        <div className="relative mt-14 md:grid md:grid-cols-[1fr_300px]">
          {/* stock levels screen */}
          <Reveal className="relative z-0">
            <div className="rule overflow-hidden rounded-lg border bg-raised/80 shadow-2xl shadow-black/40">
              <div className="rule flex items-center gap-2 border-b px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-bone/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-bone/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-bone/10" />
                <span className="ml-3 font-mono text-[11px] text-bone/40">
                  omnes / stock levels
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="rule border-b">
                      <th className="microlabel px-3 py-3 font-normal">Product</th>
                      <th className="microlabel px-3 py-3 text-right font-normal">Kigali</th>
                      <th className="microlabel px-3 py-3 text-right font-normal">Musanze</th>
                      <th className="microlabel px-3 py-3 text-right font-normal">Huye</th>
                      <th className="microlabel px-3 py-3 text-right font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {ROWS.map((r) => (
                      <tr key={r.sku} className="border-b border-bone/5 last:border-0">
                        <td className="px-3 py-3">
                          <span className="font-body text-sm text-bone/90">{r.name}</span>
                          <span className="ml-2 hidden text-bone/30 lg:inline">{r.sku}</span>
                        </td>
                        <td className="px-3 py-3 text-right text-bone/70">{r.kgl}</td>
                        <td className="px-3 py-3 text-right text-bone/70">{r.msz}</td>
                        <td className="px-3 py-3 text-right text-bone/70">{r.hye}</td>
                        <td className="px-3 py-3 text-right">
                          {r.low ? (
                            <span className="rounded border border-teal/50 px-1.5 py-0.5 text-[10px] tracking-wider text-teal">
                              REORDER
                            </span>
                          ) : (
                            <span className="rounded border border-bone/10 px-1.5 py-0.5 text-[10px] tracking-wider text-bone/40">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>

          {/* transfer dialog, overlapping the table */}
          <Reveal delay={0.15} className="relative z-10 md:-ml-3 md:mt-20">
            <div className="rule mt-6 rounded-lg border bg-ink p-5 shadow-2xl shadow-black/60 md:mt-0">
              <p className="microlabel mb-4">New transfer</p>
              <div className="space-y-3 font-mono text-xs">
                <div className="rule flex items-center justify-between rounded border px-3 py-2">
                  <span className="text-bone/40">From</span>
                  <span className="text-bone">Kigali</span>
                </div>
                <div className="rule flex items-center justify-between rounded border px-3 py-2">
                  <span className="text-bone/40">To</span>
                  <span className="text-bone">Huye</span>
                </div>
                <div className="rule flex items-center justify-between rounded border px-3 py-2">
                  <span className="text-bone/40">OMN-0311</span>
                  <span className="text-bone">40 units</span>
                </div>
              </div>
              <div className="mt-4 rounded bg-blue px-4 py-2 text-center text-sm font-medium text-bone">
                Create transfer
              </div>
              <p className="mt-3 font-mono text-[10px] leading-relaxed text-bone/30">
                writes 2 ledger entries: out of Kigali, in transit to Huye
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
