import { Link } from 'react-router-dom';

export default function PublicLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <header className="mx-auto mb-5 flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">MS Piparda School Management System</h1>
        <Link to="/login" className="text-sm font-semibold text-brand-700 hover:text-brand-600">
          Back to Login
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-4xl gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm">
          <div className="space-y-3">{children}</div>
        </section>
      </main>
    </div>
  );
}
