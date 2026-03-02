import { Link } from 'react-router-dom';

export default function PublicLayout({ title, subtitle, children }) {
  return (
    <div className="public-shell">
      <header className="public-topbar">
        <h1>MS Piparda School Management System</h1>
        <Link to="/login">Back to Login</Link>
      </header>

      <main className="public-main">
        <section className="card">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </section>
        <section className="card">{children}</section>
      </main>
    </div>
  );
}
