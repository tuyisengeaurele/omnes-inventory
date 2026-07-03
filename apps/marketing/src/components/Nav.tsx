import { motion } from 'framer-motion';
import { LOGIN_URL, SIGNUP_URL } from '../lib/links';

export default function Nav({ ready }: { ready: boolean }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={ready ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-40 border-b border-bone/5 bg-ink/80 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="#" className="group flex items-center gap-2.5">
          <img src="/mark.png" alt="" className="h-7 w-7 object-contain" />
          <span className="font-display text-xl font-semibold tracking-wide text-bone">
            omnes
            <span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-[0.25em] text-teal">
              Inventory
            </span>
          </span>
        </a>
        <nav className="flex items-center gap-6">
          <a
            href="#product"
            className="hidden text-sm text-bone/60 transition-colors hover:text-bone sm:block"
          >
            Product
          </a>
          <a
            href="#capabilities"
            className="hidden text-sm text-bone/60 transition-colors hover:text-bone sm:block"
          >
            Capabilities
          </a>
          <a
            href="#pricing"
            className="hidden text-sm text-bone/60 transition-colors hover:text-bone sm:block"
          >
            Pricing
          </a>
          <a
            href={LOGIN_URL}
            className="hidden text-sm text-bone/60 transition-colors hover:text-bone sm:block"
          >
            Sign in
          </a>
          <a
            href={SIGNUP_URL}
            className="rounded bg-blue px-4 py-1.5 text-sm font-medium text-bone transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Start free
          </a>
        </nav>
      </div>
    </motion.header>
  );
}
