import { Fragment, useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { apiRequest } from '../api/client.js';

export default function StudentPage() {
  const [data, setData] = useState({ exams: [], scores: [], subjectProfiles: [], overall: null });
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/api/student/dashboard')
      .then((result) => setData(result))
      .catch((err) => setError(err.message));
  }, []);

  const examOrder = data.exams.map((exam) => exam.exam_name);

  return (
    <Layout title="Student Dashboard">
      {error ? <p className="error">{error}</p> : null}
      <section className="grid-2">
        <article className="card">
          <h3>Published Exams</h3>
          <ul>
            {data.exams.map((exam) => (
              <li key={exam.examid}>
                {exam.exam_name} - {exam.testtype}
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>Recent Scores</h3>
          <ul>
            {data.scores.map((score) => (
              <li key={score.id}>
                {score.subject}: T {score.score_theory ?? '-'} / P {score.score_practical ?? '-'} / Total{' '}
                {score.total_score ?? '-'}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card">
        <h3>Subject-wise Exam Marks</h3>
        {data.subjectProfiles?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th rowSpan="2">Subject</th>
                  {examOrder.map((examName) => (
                    <th key={examName} colSpan="4">
                      {examName}
                    </th>
                  ))}
                  <th rowSpan="2">Weighted</th>
                  <th rowSpan="2">Final Grade</th>
                </tr>
                <tr>
                  {examOrder.map((examName) => (
                    <Fragment key={`head-${examName}`}>
                      <th>Theory</th>
                      <th>Practical</th>
                      <th>Total</th>
                      <th>Grade</th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.subjectProfiles.map((profile) => (
                  <tr key={profile.subject}>
                    <td>{profile.subject}</td>
                    {examOrder.map((examName) => (
                      <Fragment key={`${profile.subject}-${examName}`}>
                        <td>{profile.marksByExam[examName]?.theory ?? '-'}</td>
                        <td>{profile.marksByExam[examName]?.practical ?? '-'}</td>
                        <td>{profile.marksByExam[examName]?.total ?? '-'}</td>
                        <td>{profile.marksByExam[examName]?.grade ?? '-'}</td>
                      </Fragment>
                    ))}
                    <td>{profile.weightedScore}</td>
                    <td>{profile.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No marks available yet.</p>
        )}
        {data.overall ? (
          <p>
            Overall Weighted Score: <strong>{data.overall.weightedScore}</strong> | Overall Grade:{' '}
            <strong>{data.overall.grade}</strong>
          </p>
        ) : null}
      </section>
    </Layout>
  );
}
