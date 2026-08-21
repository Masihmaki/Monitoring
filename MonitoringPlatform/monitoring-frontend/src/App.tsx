import { useCallback, useState } from 'react';
import { clearSession, loadSession, saveSession, type Session } from './auth/session';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const handleSessionChange = useCallback((next: Session) => {
    saveSession(next);
    setSession(next);
  }, []);

  if (!session) {
    return <LoginPage onAuthenticated={setSession} />;
  }

  return (
    <DashboardPage
      session={session}
      onSessionChange={handleSessionChange}
      onLogout={logout}
    />
  );
}
