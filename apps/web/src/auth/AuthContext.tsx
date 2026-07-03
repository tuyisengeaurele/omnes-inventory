import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, authRequest, clearAccessToken, refreshSession, type Session } from '../lib/api';
import { can, type Permission } from '../lib/permissions';

type AuthState = {
  session: Session | null;
  loading: boolean;
  signup: (input: {
    businessName: string;
    fullName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  login: (input: { email: string; password: string; tenantId?: string }) => Promise<void>;
  acceptInvite: (input: { token: string; fullName: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  allowed: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // one silent refresh on boot picks the session back up after a page reload
  useEffect(() => {
    refreshSession()
      .then(setSession)
      .finally(() => setLoading(false));
  }, []);

  const signup: AuthState['signup'] = async (input) => {
    setSession(await authRequest('/auth/signup', input));
  };

  const login: AuthState['login'] = async (input) => {
    setSession(await authRequest('/auth/login', input));
  };

  const acceptInvite: AuthState['acceptInvite'] = async (input) => {
    setSession(await authRequest('/auth/accept-invite', input));
  };

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    clearAccessToken();
    setSession(null);
  }, []);

  const allowed = useCallback(
    (permission: Permission) => can(session?.user, permission),
    [session],
  );

  return (
    <AuthContext.Provider value={{ session, loading, signup, login, acceptInvite, logout, allowed }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth needs an AuthProvider above it');
  return ctx;
}
