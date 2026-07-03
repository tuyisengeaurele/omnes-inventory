import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { Button, ErrorNote, Label, TextInput } from '../../components/forms';
import { useAuth } from '../../auth/AuthContext';

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { acceptInvite } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await acceptInvite({ token, fullName, password });
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not accept the invite');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Join a workspace">
        <p className="text-sm text-bone/60">
          This invite link is missing its token. Ask whoever invited you to send a fresh one.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Join the workspace">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Your name</Label>
          <TextInput id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <TextInput
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Joining...' : 'Join'}
        </Button>
        <ErrorNote message={error} />
      </form>
    </AuthLayout>
  );
}
