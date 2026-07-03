import { LOGIN_URL, SIGNUP_URL } from '../lib/links';

export default function Footer() {
  return (
    <footer className="rule border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/mark.png" alt="" className="h-6 w-6 object-contain" />
            <span className="font-display text-lg font-semibold tracking-wide text-bone">omnes</span>
            <span className="microlabel">Inventory</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone/50">
            Multi-warehouse stock tracking with a ledger entry for every movement.
          </p>
        </div>
        <div>
          <p className="microlabel mb-4">Product</p>
          <ul className="space-y-2.5 text-sm text-bone/50">
            <li>
              <a href="#product" className="transition-colors hover:text-bone">
                Product tour
              </a>
            </li>
            <li>
              <a href="#capabilities" className="transition-colors hover:text-bone">
                Capabilities
              </a>
            </li>
            <li>
              <a href="#pricing" className="transition-colors hover:text-bone">
                Pricing
              </a>
            </li>
            <li>
              <a href={LOGIN_URL} className="transition-colors hover:text-bone">
                Sign in
              </a>
            </li>
            <li>
              <a href={SIGNUP_URL} className="transition-colors hover:text-bone">
                Create an account
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="microlabel mb-4">Company</p>
          <ul className="space-y-2.5 text-sm text-bone/50">
            <li>
              <a href="mailto:hello@omnesinventory.com" className="transition-colors hover:text-bone">
                hello@omnesinventory.com
              </a>
            </li>
            <li className="font-mono text-xs">Kigali, Rwanda</li>
          </ul>
        </div>
      </div>
      <div className="rule border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <span className="font-mono text-xs text-bone/30">© 2026 Omnes Inventory</span>
          <span className="font-mono text-xs text-bone/30">Every unit accounted for</span>
        </div>
      </div>
    </footer>
  );
}
