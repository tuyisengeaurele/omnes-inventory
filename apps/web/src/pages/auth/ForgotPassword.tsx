import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { Button, ErrorNote, Label, TextInput } from '../../components/forms';
import { api } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/auth/forgot-password', { body: { email } });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Reset password">
      {sent ? (
        <p className="text-sm text-bone/60">
          If that email has an account, a reset link is on its way. Check your inbox.
        </p>
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
          <Button type="submit" disabled={busy}>
            {busy ? 'Sending...' : 'Send reset link'}
          </Button>
          <ErrorNote message={error} />
          <p className="pt-2 text-sm">
            <Link to="/login" className="text-bone/50 hover:text-bone">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
