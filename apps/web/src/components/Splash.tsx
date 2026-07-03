import { motion, useReducedMotion } from 'framer-motion';

// shown on first load and on lazy route boundaries
export default function Splash() {
  const reduce = useReducedMotion();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink">
      <motion.img
        src="/mark.png"
        alt="Omnes"
        className="h-16 w-16 object-contain"
        animate={reduce ? {} : { opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
