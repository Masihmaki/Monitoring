import { useState, type CSSProperties, type FormEvent } from 'react';
import { Activity } from 'lucide-react';
import { API_BASE_URL } from './config';
import { saveSession, type Session } from './session';

type Mode = 'login' | 'register';

type AuthScreenProps = {
  onAuthenticated: (session: Session) => void;
};

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (Array.isArray(body.message) ? body.message[0] : body.message) ||
          'ورود ناموفق بود';
        throw new Error(message);
      }

      const session: Session = {
        accessToken: body.accessToken,
        user: body.user,
      };
      saveSession(session);
      onAuthenticated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای شبکه');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logo}>
            <Activity size={22} color="#6366f1" />
          </div>
          <div>
            <h1 style={styles.title}>پایش سرور</h1>
            <p style={styles.subtitle}>ورود به داشبورد کسب‌وکار شما</p>
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            type="button"
            style={mode === 'login' ? styles.tabActive : styles.tab}
            onClick={() => setMode('login')}
          >
            ورود
          </button>
          <button
            type="button"
            style={mode === 'register' ? styles.tabActive : styles.tab}
            onClick={() => setMode('register')}
          >
            ثبت‌نام
          </button>
        </div>

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            ایمیل
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
              dir="ltr"
            />
          </label>
          <label style={styles.label}>
            رمز عبور (حداقل ۸ کاراکتر)
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              dir="ltr"
            />
          </label>

          {error ? <p style={styles.error}>{error}</p> : null}

          <button type="submit" disabled={loading} style={styles.submit}>
            {loading ? 'در حال ارسال...' : mode === 'login' ? 'ورود' : 'ایجاد حساب'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: CSSProperties } = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#151c28',
    border: '1px solid #232d3f',
    borderRadius: '16px',
    padding: '28px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  logo: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    border: '1px solid #232d3f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '20px',
  },
  subtitle: {
    margin: '4px 0 0',
    color: '#9ca3af',
    fontSize: '13px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    background: 'transparent',
    color: '#9ca3af',
    border: '1px solid #232d3f',
    borderRadius: '10px',
    padding: '8px',
    cursor: 'pointer',
    fontFamily: 'Vazirmatn',
  },
  tabActive: {
    flex: 1,
    background: '#6366f1',
    color: '#fff',
    border: '1px solid #6366f1',
    borderRadius: '10px',
    padding: '8px',
    cursor: 'pointer',
    fontFamily: 'Vazirmatn',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#9ca3af',
  },
  input: {
    backgroundColor: '#0b0f17',
    color: '#f3f4f6',
    border: '1px solid #232d3f',
    borderRadius: '10px',
    padding: '10px 12px',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  error: {
    margin: 0,
    color: '#ef4444',
    fontSize: '13px',
  },
  submit: {
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    cursor: 'pointer',
    fontFamily: 'Vazirmatn',
    fontWeight: 600,
    fontSize: '14px',
  },
};
