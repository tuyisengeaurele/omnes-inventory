import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Link to="/login" className="mb-8 flex items-center gap-3">
          <img src="/mark.png" alt="" className="h-9 w-9 object-contain" />
          <span>
            <span className="block font-display text-2xl font-semibold leading-none tracking-wide">
              omnes
            </span>
            <span className="microlabel">Inventory</span>
          </span>
        </Link>
        <div className="rule rounded-lg border bg-raised/60 p-6">
          <h1 className="mb-5 font-display text-xl font-medium uppercase tracking-wide">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
