import { useState, type CSSProperties, type FormEvent } from 'react';
import { Activity } from 'lucide-react';
import { login, register } from '../api/authApi';
import type { Session } from '../auth/session';

type Mode = 'login' | 'register';

type LoginPageProps = {
  onAuthenticated: (session: Session) => void;
};

export function LoginPage({ onAuthenticated }: LoginPageProps) {
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
      const session =
        mode === 'login'
          ? await login(email, password)
          : await register(email, password);
      onAuthenticated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای شبکه');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.hero}>
          <p style={styles.kicker}>Monitoring Platform</p>
          <h1 style={styles.heroTitle}>پایش سرور</h1>
          <p style={styles.heroText}>
            نظارت زنده روی منابع میزبان، دسترس‌پذیری سایت، و هشدارهای عملیاتی برای تیم شما.
          </p>
        </div>

        <div style={styles.card} className="panel-enter">
          <div style={styles.brand}>
            <div style={styles.logo}>
              <Activity size={22} color="var(--primary)" />
            </div>
            <div>
              <h2 style={styles.title}>ورود به داشبورد</h2>
              <p style={styles.subtitle}>حساب کسب‌وکار خود را باز کنید</p>
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
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 20px',
  },
  shell: {
    width: '100%',
    maxWidth: '920px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '28px',
    alignItems: 'center',
  },
  hero: {
    padding: '12px 8px',
  },
  kicker: {
    margin: 0,
    color: 'var(--primary)',
    fontWeight: 700,
    letterSpacing: '0.04em',
    fontSize: '12px',
    textTransform: 'uppercase',
  },
  heroTitle: {
    margin: '10px 0 0',
    fontSize: '48px',
    lineHeight: 1.1,
    fontWeight: 900,
    letterSpacing: '-0.04em',
  },
  heroText: {
    margin: '14px 0 0',
    color: 'var(--text-muted)',
    fontSize: '15px',
    lineHeight: 1.8,
    maxWidth: '36ch',
  },
  card: {
    width: '100%',
    backgroundColor: 'var(--bg-elevated)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-color)',
    borderRadius: '22px',
    padding: '28px',
    boxShadow: 'var(--shadow-soft)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '22px',
  },
  logo: {
    width: '46px',
    height: '46px',
    borderRadius: '14px',
    border: '1px solid var(--border-color)',
    background: 'var(--primary-soft)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 800,
  },
  subtitle: {
    margin: '4px 0 0',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '18px',
  },
  tab: {
    flex: 1,
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-color)',
    borderRadius: '999px',
    padding: '9px',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
  },
  tabActive: {
    flex: 1,
    background: 'var(--primary)',
    color: '#fff',
    border: '1px solid var(--primary)',
    borderRadius: '999px',
    padding: '9px',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    fontWeight: 700,
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
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  input: {
    backgroundColor: 'var(--bg-solid)',
    color: 'var(--text-main)',
    border: '1px solid var(--border-strong)',
    borderRadius: '12px',
    padding: '11px 12px',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  error: {
    margin: 0,
    color: 'var(--danger)',
    fontSize: '13px',
  },
  submit: {
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: '999px',
    padding: '12px',
    cursor: 'pointer',
    fontFamily: 'var(--font-ui)',
    fontWeight: 700,
    fontSize: '14px',
  },
};
