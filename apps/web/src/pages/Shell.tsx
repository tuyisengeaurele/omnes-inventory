import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Team from './Team';
import Products from './catalog/Products';
import ProductForm from './catalog/ProductForm';
import Categories from './catalog/Categories';
import ImportProducts from './catalog/ImportProducts';
import Labels from './catalog/Labels';

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
  const { session, allowed, logout } = useAuth();
  const navigate = useNavigate();

  const nav = [
    { to: '/app', label: 'Dashboard', end: true },
    { to: '/app/products', label: 'Products' },
    { to: '/app/stock', label: 'Stock' },
    { to: '/app/orders', label: 'Orders' },
    ...(allowed('team:read') ? [{ to: '/app/team', label: 'Team' }] : []),
    { to: '/app/settings', label: 'Settings' },
  ];

  async function signOut() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="rule hidden w-56 flex-col border-r bg-raised/40 md:flex">
        <div className="rule flex items-center gap-2.5 border-b px-4 py-4">
          <img src="/mark.png" alt="" className="h-7 w-7 object-contain" />
          <span className="font-display text-lg font-semibold tracking-wide">omnes</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
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
        <header className="rule flex items-center justify-between border-b px-5 py-3">
          <span className="microlabel">{session?.tenant.name}</span>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm leading-tight text-bone/80">{session?.user.fullName}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-bone/40">
                {session?.user.role}
              </div>
            </div>
            <button
              onClick={signOut}
              className="rule rounded border px-3 py-1.5 text-xs text-bone/60 transition-colors hover:border-bone/30 hover:text-bone"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="p-5 md:p-8">
          <Routes>
            <Route index element={<Placeholder title="Dashboard" />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/categories" element={<Categories />} />
            <Route path="products/import" element={<ImportProducts />} />
            <Route path="products/:id" element={<ProductForm />} />
            <Route path="products/:id/labels" element={<Labels />} />
            <Route path="stock" element={<Placeholder title="Stock" />} />
            <Route path="orders" element={<Placeholder title="Orders" />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
