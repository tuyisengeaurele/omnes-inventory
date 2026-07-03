const REPO = 'https://github.com/tuyisengeaurele/omnes-inventory';

export default function Footer() {
  return (
    <footer className="rule border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/mark.png" alt="" className="h-6 w-6 object-contain" />
          <span className="font-display text-lg font-semibold tracking-wide text-bone">omnes</span>
          <span className="microlabel">Inventory</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-bone/50">
          <a href={REPO} target="_blank" rel="noreferrer" className="transition-colors hover:text-bone">
            GitHub
          </a>
          <span className="font-mono text-xs">Kigali, Rwanda</span>
          <span className="font-mono text-xs">© 2026 Omnes</span>
        </div>
      </div>
    </footer>
  );
}
