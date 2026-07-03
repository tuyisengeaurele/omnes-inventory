import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Splash from './components/Splash';
import { AuthProvider, useAuth } from './auth/AuthContext';

const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AcceptInvite = lazy(() => import('./pages/auth/AcceptInvite'));
const Shell = lazy(() => import('./pages/Shell'));

function Private({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Public({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (session) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/login" element={<Public><Login /></Public>} />
          <Route path="/signup" element={<Public><Signup /></Public>} />
          <Route path="/forgot-password" element={<Public><ForgotPassword /></Public>} />
          <Route path="/reset-password" element={<Public><ResetPassword /></Public>} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/app/*" element={<Private><Shell /></Private>} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
