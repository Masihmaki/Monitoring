const TOKEN_KEY = 'monitoring.accessToken';
const USER_KEY = 'monitoring.user';

export type SessionUser = {
  id: string;
  email: string;
  apiKey: string;
};

export type Session = {
  accessToken: string;
  user: SessionUser;
};

export function loadSession(): Session | null {
  try {
    const accessToken = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (!accessToken || !rawUser) {
      return null;
    }
    return { accessToken, user: JSON.parse(rawUser) as SessionUser };
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(TOKEN_KEY, session.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
