import { Fragment, useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { apiRequest } from '../api/client.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function StudentPage() {
  const [data, setData] = useState({ exams: [], scores: [], subjectProfiles: [], overall: null });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  if (isLoading) {
    return (
      <Layout title="Student Dashboard">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <LoadingSpinner label="Loading your dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Student Dashboard">
      <div className="space-y-6">
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {isRefreshing ? <p className="text-xs text-slate-500">Refreshing data...</p> : null}

        <section className="grid gap-4 lg:grid-cols-2">
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

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Subject-wise Exam Marks</h3>
          {data.subjectProfiles?.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
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
      </div>
    </Layout>
  );
}
