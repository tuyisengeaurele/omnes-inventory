import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import FlowBoard from './FlowBoard';
import { SIGNUP_URL } from '../lib/links';

// masked line reveal, the kind of entrance big product sites use:
// each line rises out of an overflow-hidden wrapper on its own delay
function Line({
  children,
  ready,
  delay,
  className,
}: {
  children: React.ReactNode;
  ready: boolean;
  delay: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={`block ${className ?? ''}`}>{children}</span>;
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className={`block ${className ?? ''}`}
        initial={{ y: '110%' }}
        animate={ready ? { y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero({ ready }: { ready: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const boardY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: ready ? { opacity: 1, y: 0 } : {},
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay },
        };

  return (
    <section ref={ref} className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
      {/* atmosphere, drifts slower than the page on scroll */}
      <motion.div
        aria-hidden
        style={reduce ? undefined : { y: glowY }}
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
      >
        <div
          className="h-full w-full rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(60,122,216,0.5), rgba(42,174,183,0.2), transparent)',
          }}
        />
      </motion.div>
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <motion.p {...enter(0.05)} className="microlabel mb-6">
              01 / Multi-warehouse inventory
            </motion.p>
            <h1 className="font-display text-6xl font-semibold uppercase leading-[0.95] tracking-tight text-bone md:text-7xl">
              <Line ready={ready} delay={0.15}>
                Every unit
              </Line>
              <Line
                ready={ready}
                delay={0.28}
                className="text-transparent [-webkit-text-stroke:1.5px_rgba(246,245,244,0.85)]"
              >
                accounted for.
              </Line>
            </h1>
            <motion.p {...enter(0.45)} className="mt-7 max-w-md text-lg leading-relaxed text-bone/60">
              Live stock counts across all your warehouses. Receiving, transfers, orders and
              counts, each one recorded the moment it happens.
            </motion.p>
            <motion.div {...enter(0.58)} className="mt-9">
              <a
                href={SIGNUP_URL}
                className="inline-block rounded bg-blue px-6 py-3 font-medium text-bone transition-all duration-300 hover:shadow-[0_0_28px_rgba(60,122,216,0.35)] hover:brightness-110 active:scale-[0.98]"
              >
                Start free
              </a>
            </motion.div>
          </div>
          <motion.div {...enter(0.7)} style={reduce ? undefined : { y: boardY }}>
            <FlowBoard started={ready} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
