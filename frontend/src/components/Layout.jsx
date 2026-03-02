import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{title}</h1>
          <small>
            MS Piparda · {user?.username} ({user?.role})
          </small>
        </div>
        <div className="topbar-actions">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
