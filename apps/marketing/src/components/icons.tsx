import { motion, useReducedMotion } from 'framer-motion';

// stroke icons drawn on scroll with a pathLength sweep.
// all hand set on a 24px grid so weights stay consistent.

export const ICONS = {
  warehouses: ['M3 21V9.5L12 3l9 6.5V21', 'M3 21h18', 'M8 21v-8h8v8', 'M8 17h8'],
  ledger: [
    'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1',
    'M9 8h6',
    'M9 12h6',
    'M9 16h4',
  ],
  transfers: ['M4 7h13', 'M14 3.5 17.5 7 14 10.5', 'M20 17H7', 'M10 13.5 6.5 17l3.5 3.5'],
  purchasing: ['M12 3v9', 'M8.5 8.5 12 12l3.5-3.5', 'M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4'],
  sales: ['M12 12V3', 'M8.5 6.5 12 3l3.5 3.5', 'M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4'],
  expiry: ['M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18', 'M12 7v5l3.5 2'],
  counts: [
    'M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3',
    'M9 2.5h6V6H9z',
    'M9 14l2 2 4-4.5',
  ],
  alerts: ['M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7', 'M10.5 20a1.8 1.8 0 0 0 3 0'],
  reports: ['M4 4v16h16', 'M8.5 16v-5', 'M13 16V7', 'M17.5 16v-3'],
  barcode: ['M4 5v14', 'M8 5v14', 'M11 5v10', 'M14 5v14', 'M17 5v10', 'M20 5v14'],
  team: [
    'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2',
    'M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    'M21 21v-2a4 4 0 0 0-3-3.85',
    'M15.5 3.15a4 4 0 0 1 0 7.7',
  ],
  data: [
    'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1',
    'M3 10h18',
    'M10 10v9',
  ],
} as const;

export type IconName = keyof typeof ICONS;

export function DrawnIcon({ name, className }: { name: IconName; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {ICONS[name].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
          whileInView={reduce ? undefined : { pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  );
}
