import Reveal from './Reveal';
import { SIGNUP_URL } from '../lib/links';

export default function ClosingCta() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full opacity-15 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(42,174,183,0.5), rgba(86,201,163,0.2), transparent)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 text-center">
        <Reveal>
          <p className="microlabel mb-6">05 / Get started</p>
          <h2 className="mx-auto max-w-3xl font-display text-5xl font-semibold uppercase leading-[0.95] tracking-tight text-bone md:text-7xl">
            Know what sits on every shelf.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-bone/60">
            Set up your first warehouse in minutes. Free until you need more room.
          </p>
          <a
            href={SIGNUP_URL}
            className="mt-10 inline-block rounded bg-blue px-8 py-3.5 font-medium text-bone transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Start free
          </a>
        </Reveal>
      </div>
    </section>
  );
}
