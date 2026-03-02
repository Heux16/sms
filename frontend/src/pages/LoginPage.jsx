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
    <div className="center full-height login-page">
      <div className="login-shell">
        <div className="login-brand" aria-hidden="true">
          <div className="login-logo">📖</div>
          <h1 className="school-name">M.S. Piparda</h1>
          <p className="school-subtitle">School Management System</p>
          <p className="school-subtitle-light">Sign in to your account</p>
        </div>

        <form className="card login-card" onSubmit={handleSubmit}>
        <label htmlFor="username-input">
          Username
          <input
            id="username-input"
            placeholder="Enter your username"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            required
            autoComplete="username"
          />
        </label>
        <label htmlFor="password-input">
          Password
          <input
            id="password-input"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
            autoComplete="current-password"
          />
        </label>

        <div className="login-row">
          <label className="checkbox-item" htmlFor="remember-me">
            <input id="remember-me" type="checkbox" />
            Remember me
          </label>
          <span className="login-forgot">Forgot password?</span>
        </div>

        {error ? <p className="error">{error}</p> : null}
        <button disabled={busy} type="submit">
          {busy ? <LoadingSpinner size="sm" label="Signing in..." /> : 'Sign In to Dashboard'}
        </button>

          <div className="inline-links">
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/terms-of-service">Terms</Link>
            <Link to="/support">Support</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </form>

        <div className="login-footer">
          <p>Need help? Contact your system administrator</p>
          <p>© 2025 M.S. Piparda School Management System</p>
        </div>
      </div>
    </div>
  );
}
