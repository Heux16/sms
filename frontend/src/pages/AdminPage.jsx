import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { apiRequest } from '../api/client.js';

function isPublished(value) {
  return value === true || value === 'true' || value === 't' || value === 1 || value === '1';
}

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [exams, setExams] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });
  const [examForm, setExamForm] = useState({
    exam_name: '',
    class: '',
    testtype: 'monthly',
    max_theory: 20,
    max_practical: 5,
    weightage: 0,
    subjectsText: ''
  });

  const publishedExamCount = exams.filter((exam) => isPublished(exam.is_published)).length;

  async function loadDashboard() {
    setError('');
    try {
      const [dashboardResult, examsResult] = await Promise.all([
        apiRequest('/api/admin/dashboard'),
        apiRequest('/api/admin/exams')
      ]);
      setData(dashboardResult);
      setExams(examsResult);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function addTeacher(event) {
    event.preventDefault();
    try {
      await apiRequest('/api/admin/teachers', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setForm({ username: '', password: '' });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  async function togglePublish(exam) {
    try {
      const currentState = isPublished(exam.is_published);
      const endpoint = currentState ? '/api/admin/exams/unpublish' : '/api/admin/exams/publish';

      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ id: exam.examid })
      });

      const nextPublished = isPublished(response?.exam?.is_published);
      setExams((prev) =>
        prev.map((item) =>
          item.examid === exam.examid ? { ...item, is_published: nextPublished } : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function addExam(event) {
    event.preventDefault();
    setError('');
    try {
      const subjects = examForm.subjectsText
        .split(',')
        .map((subject) => subject.trim())
        .filter(Boolean);

      await apiRequest('/api/admin/exams', {
        method: 'POST',
        body: JSON.stringify({
          exam_name: examForm.exam_name,
          class: examForm.class,
          testtype: examForm.testtype,
          max_theory: Number(examForm.max_theory),
          max_practical: Number(examForm.max_practical),
          weightage: Number(examForm.weightage),
          subjects
        })
      });

      setExamForm({
        exam_name: '',
        class: '',
        testtype: 'monthly',
        max_theory: 20,
        max_practical: 5,
        weightage: 0,
        subjectsText: ''
      });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Admin Dashboard">
      {error ? <p className="error">{error}</p> : null}
      <section className="grid-3">
        <article className="card">
          <h3>Teachers</h3>
          <strong>{data?.teachers?.length || 0}</strong>
        </article>
        <article className="card">
          <h3>Students</h3>
          <strong>{data?.students?.length || 0}</strong>
        </article>
        <article className="card">
          <h3>Published Exams</h3>
          <strong>{publishedExamCount}</strong>
        </article>
      </section>

      <section className="grid-2">
        <form className="card" onSubmit={addTeacher}>
          <h3>Add Teacher</h3>
          <input
            placeholder="username"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            required
          />
          <input
            placeholder="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <button type="submit">Create Teacher</button>
        </form>

        <form className="card" onSubmit={addExam}>
          <h3>Create Exam</h3>
          <input
            placeholder="Exam name"
            value={examForm.exam_name}
            onChange={(e) => setExamForm((prev) => ({ ...prev, exam_name: e.target.value }))}
            required
          />
          <input
            placeholder="Class"
            value={examForm.class}
            onChange={(e) => setExamForm((prev) => ({ ...prev, class: e.target.value }))}
            required
          />
          <select
            value={examForm.testtype}
            onChange={(e) => setExamForm((prev) => ({ ...prev, testtype: e.target.value }))}
          >
            <option value="monthly">Monthly</option>
            <option value="term">Term</option>
          </select>
          <input
            type="number"
            min="0"
            placeholder="Max theory"
            value={examForm.max_theory}
            onChange={(e) => setExamForm((prev) => ({ ...prev, max_theory: e.target.value }))}
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Max practical"
            value={examForm.max_practical}
            onChange={(e) => setExamForm((prev) => ({ ...prev, max_practical: e.target.value }))}
            required
          />
          <input
            type="number"
            min="0"
            max="100"
            placeholder="Weightage %"
            value={examForm.weightage}
            onChange={(e) => setExamForm((prev) => ({ ...prev, weightage: e.target.value }))}
            required
          />
          <input
            placeholder="Subjects (comma separated)"
            value={examForm.subjectsText}
            onChange={(e) => setExamForm((prev) => ({ ...prev, subjectsText: e.target.value }))}
          />
          <button type="submit">Save Exam</button>
        </form>
      </section>

      <section className="card">
        <h3>Exam Status</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Exam</th>
                <th>Type</th>
                <th>Published</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => {
                const published = isPublished(exam.is_published);
                return (
                <tr key={exam.examid}>
                  <td>{exam.class}</td>
                  <td>{exam.exam_name}</td>
                  <td>{exam.testtype}</td>
                  <td>{published ? 'Yes' : 'No'}</td>
                  <td>
                    <button type="button" onClick={() => togglePublish(exam)}>
                      {published ? 'Unpublish' : 'Publish'}
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}
