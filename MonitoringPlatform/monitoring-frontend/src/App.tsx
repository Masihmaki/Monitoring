import { useCallback, useState } from 'react';
import { clearSession, loadSession, type Session } from './auth/session';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  if (!session) {
    return <LoginPage onAuthenticated={setSession} />;
  }

  return <DashboardPage session={session} onLogout={logout} />;
}
