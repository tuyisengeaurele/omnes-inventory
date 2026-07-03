import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { Button, ErrorNote, Label, TextInput } from '../../components/forms';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api';

type TenantChoice = { tenantId: string; tenantName: string };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [choices, setChoices] = useState<TenantChoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent, tenantId?: string) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login({ email, password, tenantId });
      navigate('/app');
    } catch (err) {
      // the same email can live in several workspaces, the api then asks
      // which one to sign into
      if (err instanceof ApiError && err.status === 300) {
        setChoices((err.body as { pickTenant: TenantChoice[] }).pickTenant);
      } else {
        setError(err instanceof Error ? err.message : 'sign in failed');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Sign in">
      {choices ? (
        <div>
          <p className="mb-4 text-sm text-bone/60">
            This email belongs to more than one workspace. Pick the one you want.
          </p>
          <div className="space-y-2">
            {choices.map((c) => (
              <button
                key={c.tenantId}
                disabled={busy}
                onClick={(e) => submit(e, c.tenantId)}
                className="rule block w-full rounded border px-4 py-2.5 text-left text-sm text-bone/80 transition-colors hover:border-teal/50 hover:text-bone"
              >
                {c.tenantName}
              </button>
            ))}
          </div>
          <ErrorNote message={error} />
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <TextInput
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <TextInput
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </Button>
          <ErrorNote message={error} />
          <div className="flex items-center justify-between pt-2 text-sm">
            <Link to="/forgot-password" className="text-bone/50 hover:text-bone">
              Forgot password
            </Link>
            <Link to="/signup" className="text-bone/50 hover:text-bone">
              Create a workspace
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
