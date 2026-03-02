import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function Layout({ title, children, fullWidth = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div
      className={`min-h-screen w-full px-4 py-4 sm:px-6 lg:px-8 ${
        fullWidth ? 'max-w-none' : 'mx-auto max-w-7xl'
      }`}
    >
      <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
          <small className="text-sm text-slate-600">
            MS Piparda · {user?.username} ({user?.role})
          </small>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            Logout
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
