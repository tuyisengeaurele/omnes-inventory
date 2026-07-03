import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Splash from './components/Splash';

const Login = lazy(() => import('./pages/Login'));
const Shell = lazy(() => import('./pages/Shell'));

export default function App() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/app/*" element={<Shell />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Suspense>
  );
}
