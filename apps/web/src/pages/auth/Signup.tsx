import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { Button, ErrorNote, Label, TextInput } from '../../components/forms';
import { useAuth } from '../../auth/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: '', fullName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signup(form);
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'signup failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create your workspace">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business name</Label>
          <TextInput id="businessName" required value={form.businessName} onChange={set('businessName')} />
        </div>
        <div>
          <Label htmlFor="fullName">Your name</Label>
          <TextInput id="fullName" required value={form.fullName} onChange={set('fullName')} autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <TextInput id="email" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <TextInput
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Setting up...' : 'Create workspace'}
        </Button>
        <ErrorNote message={error} />
        <p className="pt-2 text-sm text-bone/50">
          Already set up?{' '}
          <Link to="/login" className="text-bone/70 hover:text-bone">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
