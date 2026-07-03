import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

// The signature hero visual. A schematic warehouse where units travel
// dock to bin to truck, and every arrival writes a row into the ledger.
// This is the product thesis animated: no stock change without an entry.

type MoveType = 'RCV' | 'SHIP' | 'XFER';

type Point = { x: number; y: number };

type Move = {
  id: number;
  type: MoveType;
  sku: string;
  qty: number;
  from: string;
  to: string;
  start: Point;
  end: Point;
  time: string;
};

type LedgerRow = Omit<Move, 'start' | 'end'>;

const SKUS = ['OMN-0042', 'OMN-1107', 'OMN-0311', 'OMN-2280', 'OMN-0958', 'OMN-1663'];

const BIN_IDS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];

// percentage coordinates inside the schematic
const DOCK: Point = { x: 7, y: 50 };
const TRUCK: Point = { x: 93, y: 50 };
const BIN_POS: Record<string, Point> = {
  A1: { x: 34, y: 26 },
  A2: { x: 52, y: 26 },
  A3: { x: 70, y: 26 },
  B1: { x: 34, y: 72 },
  B2: { x: 52, y: 72 },
  B3: { x: 70, y: 72 },
};

const TYPE_COLOR: Record<MoveType, string> = {
  RCV: 'bg-green',
  SHIP: 'bg-blue',
  XFER: 'bg-teal',
};

const TYPE_TEXT: Record<MoveType, string> = {
  RCV: 'text-green',
  SHIP: 'text-blue',
  XFER: 'text-teal',
};

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function clock(): string {
  return new Date().toTimeString().slice(0, 8);
}

const STATIC_ROWS: LedgerRow[] = [
  { id: 1, type: 'RCV', sku: 'OMN-0042', qty: 24, from: 'DOCK', to: 'A1', time: '09:41:07' },
  { id: 2, type: 'SHIP', sku: 'OMN-1107', qty: 6, from: 'B2', to: 'OUT', time: '09:41:31' },
  { id: 3, type: 'XFER', sku: 'OMN-0311', qty: 12, from: 'A3', to: 'B1', time: '09:42:02' },
  { id: 4, type: 'RCV', sku: 'OMN-2280', qty: 18, from: 'DOCK', to: 'B3', time: '09:42:40' },
  { id: 5, type: 'SHIP', sku: 'OMN-0958', qty: 9, from: 'A2', to: 'OUT', time: '09:43:11' },
];

export default function FlowBoard({ started }: { started: boolean }) {
  const reduce = useReducedMotion();
  const [bins, setBins] = useState<Record<string, number>>({
    A1: 132, A2: 87, A3: 214, B1: 56, B2: 148, B3: 61,
  });
  const [ledger, setLedger] = useState<LedgerRow[]>(reduce ? STATIC_ROWS : []);
  const [inFlight, setInFlight] = useState<Move[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const nextId = useRef(10);
  const binsRef = useRef(bins);
  binsRef.current = bins;

  useEffect(() => {
    if (reduce || !started) return;

    const spawn = () => {
      const roll = Math.random();
      const id = nextId.current++;
      const sku = pick(SKUS);
      const qty = 1 + Math.floor(Math.random() * 24);
      let move: Move;

      if (roll < 0.45) {
        const to = pick(BIN_IDS);
        move = { id, type: 'RCV', sku, qty, from: 'DOCK', to, start: DOCK, end: BIN_POS[to], time: clock() };
      } else if (roll < 0.8) {
        const stocked = BIN_IDS.filter((b) => binsRef.current[b] >= qty);
        if (stocked.length === 0) return;
        const from = pick(stocked);
        move = { id, type: 'SHIP', sku, qty, from, to: 'OUT', start: BIN_POS[from], end: TRUCK, time: clock() };
      } else {
        const stocked = BIN_IDS.filter((b) => binsRef.current[b] >= qty);
        if (stocked.length === 0) return;
        const from = pick(stocked);
        const to = pick(BIN_IDS.filter((b) => b !== from));
        move = { id, type: 'XFER', sku, qty, from, to, start: BIN_POS[from], end: BIN_POS[to], time: clock() };
      }
      setInFlight((f) => [...f, move]);
    };

    spawn();
    const timer = setInterval(spawn, 2400);
    return () => clearInterval(timer);
  }, [reduce, started]);

  const land = (move: Move) => {
    setInFlight((f) => f.filter((m) => m.id !== move.id));
    setBins((b) => {
      const next = { ...b };
      if (move.type === 'RCV') next[move.to] += move.qty;
      if (move.type === 'SHIP') next[move.from] -= move.qty;
      if (move.type === 'XFER') {
        next[move.from] -= move.qty;
        next[move.to] += move.qty;
      }
      return next;
    });
    setLedger((rows) => [{ ...move }, ...rows].slice(0, 7));
    const landed = move.type === 'SHIP' ? move.from : move.to;
    setFlash(landed);
    setTimeout(() => setFlash((f) => (f === landed ? null : f)), 600);
  };

  const onHand = Object.values(bins).reduce((a, b) => a + b, 0);

  return (
    <div className="rule overflow-hidden rounded-lg border bg-raised/80 shadow-2xl shadow-blue-deep/10 backdrop-blur">
      {/* header strip */}
      <div className="rule flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full bg-green ${reduce ? '' : 'animate-pulse'}`} />
          <span className="microlabel">Live movements</span>
        </div>
        <span className="font-mono text-[11px] tracking-widest text-bone/50">
          ON HAND <span className="text-bone">{onHand.toLocaleString()}</span>
        </span>
      </div>

      <div className="grid md:grid-cols-[1.2fr_1fr]">
        {/* schematic */}
        <div className="rule relative aspect-[4/3] border-b md:aspect-auto md:border-b-0 md:border-r">
          {/* dock */}
          <div className="absolute left-[3%] top-1/2 flex h-3/5 w-[8%] -translate-y-1/2 items-center justify-center rounded border border-green/30 bg-green/5">
            <span className="microlabel rotate-180 [writing-mode:vertical-lr]">Dock</span>
          </div>
          {/* truck / out */}
          <div className="absolute right-[3%] top-1/2 flex h-3/5 w-[8%] -translate-y-1/2 items-center justify-center rounded border border-blue/30 bg-blue/5">
            <span className="microlabel [writing-mode:vertical-lr]">Out</span>
          </div>
          {/* bins */}
          {BIN_IDS.map((id) => (
            <div
              key={id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${BIN_POS[id].x}%`, top: `${BIN_POS[id].y}%` }}
            >
              <div
                className={`w-[72px] rounded border px-2 py-1.5 transition-colors duration-500 ${
                  flash === id ? 'border-teal/60 bg-teal/15' : 'rule bg-ink/60'
                }`}
              >
                <div className="font-mono text-[10px] tracking-widest text-bone/40">{id}</div>
                <div className="font-mono text-sm text-bone">{bins[id]}</div>
              </div>
            </div>
          ))}
          {/* moving units */}
          {!reduce &&
            inFlight.map((m) => (
              <motion.div
                key={m.id}
                className={`absolute h-2.5 w-2.5 rounded-sm ${TYPE_COLOR[m.type]}`}
                initial={{ left: `${m.start.x}%`, top: `${m.start.y}%`, opacity: 0, scale: 0.6 }}
                animate={{
                  left: `${m.end.x}%`,
                  top: `${m.end.y}%`,
                  opacity: [0, 1, 1, 0.9],
                  scale: 1,
                }}
                transition={{ duration: 1.3, ease: 'easeInOut' }}
                onAnimationComplete={() => land(m)}
                style={{ boxShadow: '0 0 12px rgba(86, 201, 163, 0.35)' }}
              />
            ))}
        </div>

        {/* ledger */}
        <div className="flex min-h-[240px] flex-col md:min-h-[300px]">
          <div className="rule grid grid-cols-[auto_auto_1fr_auto] gap-x-3 border-b px-4 py-2">
            <span className="microlabel">Time</span>
            <span className="microlabel">Type</span>
            <span className="microlabel">SKU</span>
            <span className="microlabel text-right">Qty</span>
          </div>
          <div className="flex-1 overflow-hidden px-4 py-1">
            <AnimatePresence initial={false}>
              {ledger.map((row) => (
                <motion.div
                  key={row.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-[auto_auto_1fr_auto] items-baseline gap-x-3 border-b border-bone/5 py-1.5 font-mono text-xs"
                >
                  <span className="text-bone/40">{row.time}</span>
                  <span className={`${TYPE_TEXT[row.type]}`}>{row.type}</span>
                  <span className="text-bone/70">
                    {row.sku}
                    <span className="text-bone/30"> {row.from}&gt;{row.to}</span>
                  </span>
                  <span className="text-right text-bone">
                    {row.type === 'SHIP' ? '-' : '+'}
                    {row.qty}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {ledger.length === 0 && (
              <div className="py-6 font-mono text-xs text-bone/30">waiting for first movement...</div>
            )}
          </div>
          <div className="rule border-t px-4 py-2">
            <span className="font-mono text-[11px] text-bone/40">
              every movement above lands in the ledger and stays there
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
