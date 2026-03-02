import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.username, form.password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center" aria-hidden="true">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-b from-sky-500 to-sky-600 text-2xl text-white shadow-lg shadow-sky-300/60">
            📖
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">M.S. Piparda</h1>
          <p className="mt-1 text-sm text-slate-600">School Management System</p>
          <p className="text-xs text-slate-500">Sign in to your account</p>
        </div>

        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          onSubmit={handleSubmit}
        >
          <label htmlFor="username-input" className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <input
              id="username-input"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              required
              autoComplete="username"
            />
          </label>
          <label htmlFor="password-input" className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              id="password-input"
              type="password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </label>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-slate-600" htmlFor="remember-me">
              <input id="remember-me" type="checkbox" className="h-4 w-4 accent-brand-600" />
              Remember me
            </label>
            <span className="font-semibold text-brand-700">Forgot password?</span>
          </div>

          {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <button
            disabled={busy}
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <LoadingSpinner size="sm" label="Signing in..." /> : 'Sign In to Dashboard'}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <Link className="font-semibold text-brand-700 hover:text-brand-600" to="/privacy-policy">
              Privacy
            </Link>
            <Link className="font-semibold text-brand-700 hover:text-brand-600" to="/terms-of-service">
              Terms
            </Link>
            <Link className="font-semibold text-brand-700 hover:text-brand-600" to="/support">
              Support
            </Link>
            <Link className="font-semibold text-brand-700 hover:text-brand-600" to="/contact">
              Contact
            </Link>
          </div>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500">
          <p>Need help? Contact your system administrator</p>
          <p>© 2025 M.S. Piparda School Management System</p>
        </div>
      </div>
    </div>
  );
}
