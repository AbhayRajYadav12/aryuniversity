import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AryLogo from '../components/AryLogo';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = params.get('role') === 'admin' ? 'admin' : 'student';

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    }
  }, [user, navigate]);

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState(
    initialRole === 'admin' ? 'admin@university.edu' : 'alice@university.edu'
  );
  const [password, setPassword] = useState(
    initialRole === 'admin' ? 'Admin@12345' : 'Student@12345'
  );
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const hint = useMemo(
    () =>
      role === 'admin'
        ? 'Administrator portal — Encryption Center & monitoring'
        : 'Student portal — authorized digital books only',
    [role]
  );

  const switchRole = (next) => {
    setRole(next);
    setError('');
    if (next === 'admin') {
      setEmail('admin@university.edu');
      setPassword('Admin@12345');
    } else {
      setEmail('alice@university.edu');
      setPassword('Student@12345');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      if (role === 'admin' && user.role !== 'admin') {
        setError('This account is not an administrator.');
        return;
      }
      if (role === 'student' && user.role !== 'student') {
        setError('Use the Administrator tab for staff accounts.');
        return;
      }
      if (!remember) {
        // Session cookie still applies for JWT TTL; remember is UX-only for demo prefills
        sessionStorage.setItem('ary_remember', '0');
      } else {
        sessionStorage.setItem('ary_remember', '1');
      }
      navigate(user.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <section className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(155deg,#071833 0%,#0b5fff 55%,#22d3ee 120%)' }}
        />
        <div className="relative">
          <AryLogo light />
        </div>
        <div className="relative max-w-md space-y-4">
          <h1 className="font-display text-4xl leading-tight">Secure access to academic knowledge.</h1>
          <p className="text-white/85 text-lg">
            Authenticated sessions, encrypted documents, and audited reading — designed for ARY
            University&apos;s Secure Digital Library.
          </p>
          <p className="text-sm text-white/70 italic">
            Protecting Knowledge. Securing Access. Empowering Learning.
          </p>
        </div>
        <p className="relative text-sm text-white/70">Computer Network Security · Local demonstration</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md card-panel p-8">
          <div className="lg:hidden mb-6">
            <AryLogo />
          </div>
          <h2 className="text-2xl font-semibold text-brand-900">Sign in</h2>
          <p className="text-sm text-brand-900/55 mt-1 mb-5">{hint}</p>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-brand-50 mb-6">
            {['student', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => switchRole(r)}
                className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
                  role === r ? 'bg-white shadow text-brand-700' : 'text-brand-900/55'
                }`}
              >
                {r === 'admin' ? 'Administrator' : 'Student'}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">
                University email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-900/40"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-brand-900/70">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-brand-200"
              />
              Remember this browser for the demo session
            </label>
            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-100">
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating…
                </>
              ) : (
                'Enter secure library'
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-brand-900/50">
            Forgot password? For this local demo, re-run <code>npm run seed</code> to restore
            demonstration accounts. Passwords are hashed with Argon2id — never stored in plaintext.
          </p>

          <div className="mt-5 rounded-xl bg-brand-50/80 border border-brand-100 p-4 text-xs text-brand-900/70 space-y-1">
            <p className="font-semibold text-brand-900">Demo accounts</p>
            <p>Admin: admin@university.edu / Admin@12345</p>
            <p>Student: alice@university.edu / Student@12345</p>
            <p>Student: bob@university.edu / Student@12345</p>
          </div>

          <Link to="/" className="mt-6 inline-block text-sm text-brand-600 font-semibold">
            ← Back to ARY landing page
          </Link>
        </div>
      </section>
    </div>
  );
}
