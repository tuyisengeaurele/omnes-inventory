import { motion, useReducedMotion } from 'framer-motion';
import FlowBoard from './FlowBoard';

const REPO = 'https://github.com/tuyisengeaurele/omnes-inventory';

export default function Hero({ ready }: { ready: boolean }) {
  const reduce = useReducedMotion();
  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: ready ? { opacity: 1, y: 0 } : {},
          transition: { duration: 0.6, ease: 'easeOut' as const, delay },
        };

  return (
    <section className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
      {/* atmosphere, kept behind everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(60,122,216,0.5), rgba(42,174,183,0.2), transparent)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <motion.p {...enter(0.05)} className="microlabel mb-6">
              01 / Multi-warehouse inventory
            </motion.p>
            <motion.h1
              {...enter(0.15)}
              className="font-display text-6xl font-semibold uppercase leading-[0.95] tracking-tight text-bone md:text-7xl"
            >
              Every unit
              <br />
              <span className="text-transparent [-webkit-text-stroke:1.5px_rgba(246,245,244,0.85)]">
                accounted for.
              </span>
            </motion.h1>
            <motion.p {...enter(0.3)} className="mt-7 max-w-md text-lg leading-relaxed text-bone/60">
              Omnes tracks stock across all your warehouses and writes a ledger entry for every
              movement. If it moved, you can prove it.
            </motion.p>
            <motion.div {...enter(0.42)} className="mt-9 flex items-center gap-5">
              <a
                href="#pricing"
                className="rounded bg-blue px-6 py-3 font-medium text-bone transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Start free
              </a>
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-bone/50 underline-offset-4 transition-colors hover:text-bone hover:underline"
              >
                View the repo
              </a>
            </motion.div>
          </div>
          <motion.div {...enter(0.55)}>
            <FlowBoard started={ready} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
