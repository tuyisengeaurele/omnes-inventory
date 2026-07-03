import { NavLink, Route, Routes } from 'react-router-dom';

const NAV = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/products', label: 'Products' },
  { to: '/app/stock', label: 'Stock' },
  { to: '/app/orders', label: 'Orders' },
  { to: '/app/settings', label: 'Settings' },
];

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rule rounded-lg border border-dashed p-10 text-center">
      <p className="font-display text-2xl font-medium uppercase tracking-wide text-bone/70">
        {title}
      </p>
      <p className="mt-2 text-sm text-bone/40">This area arrives in a later phase.</p>
    </div>
  );
}

export default function Shell() {
  return (
    <div className="flex min-h-screen">
      <aside className="rule hidden w-56 flex-col border-r bg-raised/40 md:flex">
        <div className="rule flex items-center gap-2.5 border-b px-4 py-4">
          <img src="/mark.png" alt="" className="h-7 w-7 object-contain" />
          <span className="font-display text-lg font-semibold tracking-wide">omnes</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-blue/15 text-bone' : 'text-bone/60 hover:bg-bone/5 hover:text-bone'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="rule flex items-center justify-between border-b px-5 py-3.5">
          <span className="microlabel">Workspace</span>
          <span className="h-8 w-8 rounded-full bg-raised" />
        </header>
        <main className="p-5 md:p-8">
          <Routes>
            <Route index element={<Placeholder title="Dashboard" />} />
            <Route path="products" element={<Placeholder title="Products" />} />
            <Route path="stock" element={<Placeholder title="Stock" />} />
            <Route path="orders" element={<Placeholder title="Orders" />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
