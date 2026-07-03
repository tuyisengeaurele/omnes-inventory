import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

// shown on first paint, fades out once the page is ready.
// the same idea ships in the app later for lazy route boundaries.
export default function Splash({ visible }: { visible: boolean }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink"
        >
          <motion.img
            src="/mark.png"
            alt="Omnes"
            className="h-20 w-20 object-contain"
            animate={reduce ? {} : { opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
