import { Fragment, useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { apiRequest } from '../api/client.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { Menu, X } from 'lucide-react';

export default function StudentPage() {
  const [data, setData] = useState({ exams: [], scores: [], subjectProfiles: [], overall: null });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [busyPassword, setBusyPassword] = useState(false);

  async function loadStudentDashboard({ background = false } = {}) {
    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setError('');
    }

    try {
      const result = await apiRequest('/api/student/dashboard');
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      if (background) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    loadStudentDashboard();

    const intervalId = setInterval(() => {
      loadStudentDashboard({ background: true });
    }, 20000);

    return () => clearInterval(intervalId);
  }, []);

  const examOrder = data.exams.map((exam) => exam.exam_name);
  const navItems = [
    { id: 'student-summary', label: 'Overview' },
    { id: 'student-marks', label: 'Subject-wise Marks' },
    { id: 'student-password', label: 'Change Password' }
  ];

  async function changePassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    setBusyPassword(true);
    try {
      const result = await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setMessage(result?.message || 'Password changed successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyPassword(false);
    }
  }

  function jumpTo(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSidebarOpen(false);
    }
  }

  if (isLoading) {
    return (
      <Layout title="Student Dashboard" fullWidth>
        <div className="rounded-2xl bg-slate-50 p-3 sm:p-4 lg:p-6">
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
            <LoadingSpinner label="Loading your dashboard..." />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Student Dashboard" fullWidth>
      <div className="rounded-2xl bg-slate-50 p-3 sm:p-4 lg:p-6">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            <Menu size={16} />
            Menu
          </button>
          {isRefreshing ? <span className="text-xs text-slate-500">Refreshing...</span> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Student Panels</p>
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => jumpTo(item.id)}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {sidebarOpen ? (
            <div className="fixed inset-0 z-40 bg-slate-900/35 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <div
                className="h-full w-72 rounded-r-2xl bg-white p-4 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Navigate</p>
                  <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-1 text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => jumpTo(item.id)}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="min-w-0 space-y-6">
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
        {isRefreshing ? <p className="text-xs text-slate-500">Refreshing data...</p> : null}

        <section id="student-summary" className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Published Exams</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {data.exams.map((exam) => (
                <li key={exam.examid} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  {exam.exam_name} - {exam.testtype}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Recent Scores</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {data.scores.map((score) => (
                <li key={score.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  {score.subject}: T {score.score_theory ?? '-'} / P {score.score_practical ?? '-'} / Total{' '}
                  {score.total_score ?? '-'}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section id="student-marks" className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Subject-wise Exam Marks</h3>
          {data.subjectProfiles?.length ? (
            <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-max w-full border-collapse text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th rowSpan="2" className="border border-slate-200 px-3 py-2 text-left font-semibold">Subject</th>
                    {examOrder.map((examName) => (
                      <th key={examName} colSpan="4" className="border border-slate-200 px-3 py-2 text-left font-semibold">
                        {examName}
                      </th>
                    ))}
                    <th rowSpan="2" className="border border-slate-200 px-3 py-2 text-left font-semibold">Weighted</th>
                    <th rowSpan="2" className="border border-slate-200 px-3 py-2 text-left font-semibold">Final Grade</th>
                  </tr>
                  <tr>
                    {examOrder.map((examName) => (
                      <Fragment key={`head-${examName}`}>
                        <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Theory</th>
                        <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Practical</th>
                        <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Total</th>
                        <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Grade</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.subjectProfiles.map((profile) => (
                    <tr key={profile.subject} className="bg-white">
                      <td className="border border-slate-200 px-3 py-2">{profile.subject}</td>
                      {examOrder.map((examName) => (
                        <Fragment key={`${profile.subject}-${examName}`}>
                          <td className="border border-slate-200 px-3 py-2">{profile.marksByExam[examName]?.theory ?? '-'}</td>
                          <td className="border border-slate-200 px-3 py-2">{profile.marksByExam[examName]?.practical ?? '-'}</td>
                          <td className="border border-slate-200 px-3 py-2">{profile.marksByExam[examName]?.total ?? '-'}</td>
                          <td className="border border-slate-200 px-3 py-2">{profile.marksByExam[examName]?.grade ?? '-'}</td>
                        </Fragment>
                      ))}
                      <td className="border border-slate-200 px-3 py-2">{profile.weightedScore}</td>
                      <td className="border border-slate-200 px-3 py-2 font-semibold">{profile.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No marks available yet.</p>
          )}
          {data.overall ? (
            <p className="text-sm text-slate-700">
              Overall Weighted Score: <strong>{data.overall.weightedScore}</strong> | Overall Grade:{' '}
              <strong>{data.overall.grade}</strong>
            </p>
          ) : null}
        </section>

        <section id="student-password" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form className="space-y-4" onSubmit={changePassword}>
            <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
              placeholder="Old password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
              required
              autoComplete="current-password"
            />
            <input
              type="password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
              placeholder="New password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              required
              autoComplete="new-password"
            />
            <input
              type="password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={busyPassword}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {busyPassword ? <LoadingSpinner size="sm" label="Updating password..." /> : 'Update Password'}
            </button>
          </form>
        </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
