import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { Button, ErrorNote, Label, Select, TextInput } from '../components/forms';

type Member = {
  id: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
  isActive: boolean;
};

type PendingInvite = { id: string; email: string; role: string; expiresAt: string };

type TeamData = { users: Member[]; invites: PendingInvite[] };

export default function Team() {
  const { session, allowed } = useAuth();
  const [data, setData] = useState<TeamData | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STAFF');
  const [error, setError] = useState<string | null>(null);
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<TeamData>('/team').then(setData).catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  async function invite(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setAcceptUrl(null);
    try {
      const res = await api<{ acceptUrl?: string }>('/team/invites', { body: { email, role } });
      setEmail('');
      // in local dev the api hands the link back since mail goes to the console
      if (res.acceptUrl) setAcceptUrl(res.acceptUrl);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'invite failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(member: Member) {
    setError(null);
    const action = member.isActive ? 'deactivate' : 'reactivate';
    try {
      await api(`/team/users/${member.id}/${action}`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed`);
    }
  }

  const manage = allowed('team:manage');
  const me = session?.user.id;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-tight">Team</h1>

      {manage && (
        <form onSubmit={invite} className="rule mt-6 rounded-lg border bg-raised/40 p-5">
          <p className="microlabel mb-4">Invite someone</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="invite-email">Email</Label>
              <TextInput
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Label htmlFor="invite-role">Role</Label>
              <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)}>
                {session?.user.role === 'OWNER' && <option value="ADMIN">Admin</option>}
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Staff</option>
              </Select>
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Sending...' : 'Send invite'}
            </Button>
          </div>
          {acceptUrl && (
            <p className="mt-3 break-all font-mono text-xs text-bone/50">
              dev note: mail goes to the console, the invite link is {acceptUrl}
            </p>
          )}
        </form>
      )}

      <ErrorNote message={error} />

      <div className="rule mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="rule border-b bg-raised/40">
              <th className="microlabel px-4 py-3 font-normal">Name</th>
              <th className="microlabel px-4 py-3 font-normal">Role</th>
              <th className="microlabel px-4 py-3 font-normal">Status</th>
              {manage && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {data?.users.map((member) => (
              <tr key={member.id} className="rule border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="text-bone/90">{member.fullName}</div>
                  <div className="font-mono text-xs text-bone/40">{member.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded border border-bone/15 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-bone/60">
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={member.isActive ? 'text-green' : 'text-bone/40'}>
                    {member.isActive ? 'active' : 'deactivated'}
                  </span>
                </td>
                {manage && (
                  <td className="px-4 py-3 text-right">
                    {member.id !== me && member.role !== 'OWNER' && (
                      <Button kind="quiet" type="button" onClick={() => toggle(member)}>
                        {member.isActive ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.invites.length > 0 && (
        <div className="mt-6">
          <p className="microlabel mb-3">Pending invites</p>
          <ul className="space-y-2">
            {data.invites.map((inv) => (
              <li key={inv.id} className="rule flex items-center justify-between rounded border px-4 py-2.5 text-sm">
                <span className="text-bone/70">{inv.email}</span>
                <span className="font-mono text-xs text-bone/40">{inv.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
