import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { apiRequest } from '../api/client.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const SUBJECT_OPTIONS = [
  'english',
  'hindi',
  'kaushal bodh',
  'khel yatra',
  'kriti',
  'maths',
  'sanskrit',
  'science',
  'sst'
];

function isPublished(value) {
  return value === true || value === 'true' || value === 't' || value === 1 || value === '1';
}

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [userEdits, setUserEdits] = useState({});
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [busyTeacher, setBusyTeacher] = useState(false);
  const [busyExam, setBusyExam] = useState(false);
  const [busyToggleId, setBusyToggleId] = useState(null);
  const [form, setForm] = useState({ username: '', password: '' });
  const [examForm, setExamForm] = useState({
    exam_name: '',
    class: '',
    testtype: 'monthly',
    max_theory: 20,
    max_practical: 5,
    weightage: 0,
    subjects: []
  });

  const publishedExamCount = exams.filter((exam) => isPublished(exam.is_published)).length;
  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedUserSearch) {
      return true;
    }

    const haystack = [
      user.username,
      user.role,
      user.class,
      user.rollnumber,
      String(user.id)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedUserSearch);
  });

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const safeUserPage = Math.min(userPage, totalUserPages);
  const userStartIndex = (safeUserPage - 1) * userPageSize;
  const pagedUsers = filteredUsers.slice(userStartIndex, userStartIndex + userPageSize);

  async function loadDashboard({ background = false } = {}) {
    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setError('');
    }
    try {
      const [dashboardResult, examsResult, usersResult] = await Promise.all([
        apiRequest('/api/admin/dashboard'),
        apiRequest('/api/admin/exams'),
        apiRequest('/api/admin/users')
      ]);
      setData(dashboardResult);
      setExams(examsResult);
      setUsers(usersResult);
      setUserEdits((prev) => {
        const next = { ...prev };
        usersResult.forEach((user) => {
          if (!next[user.id]) {
            next[user.id] = { username: user.username || '', password: '' };
          }
        });
        return next;
      });
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
    loadDashboard();

    const intervalId = setInterval(() => {
      loadDashboard({ background: true });
    }, 20000);

    return () => clearInterval(intervalId);
  }, []);

  async function addTeacher(event) {
    event.preventDefault();
    setBusyTeacher(true);
    try {
      await apiRequest('/api/admin/teachers', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setForm({ username: '', password: '' });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyTeacher(false);
    }
  }

  async function togglePublish(exam) {
    setBusyToggleId(exam.examid);
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
    } finally {
      setBusyToggleId(null);
    }
  }

  async function addExam(event) {
    event.preventDefault();
    setError('');
    setBusyExam(true);
    try {
      await apiRequest('/api/admin/exams', {
        method: 'POST',
        body: JSON.stringify({
          exam_name: examForm.exam_name,
          class: examForm.class,
          testtype: examForm.testtype,
          max_theory: Number(examForm.max_theory),
          max_practical: Number(examForm.max_practical),
          weightage: Number(examForm.weightage),
          subjects: examForm.subjects
        })
      });

      setExamForm({
        exam_name: '',
        class: '',
        testtype: 'monthly',
        max_theory: 20,
        max_practical: 5,
        weightage: 0,
        subjects: []
      });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyExam(false);
    }
  }

  async function updateUser(userId) {
    const draft = userEdits[userId] || { username: '', password: '' };
    const username = String(draft.username || '').trim();
    const password = String(draft.password || '');

    if (!username) {
      setError('Name/username cannot be empty');
      return;
    }

    setBusyUserId(userId);
    setError('');

    try {
      const response = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ username, password })
      });

      setUsers((prev) => prev.map((user) => (user.id === userId ? response.user : user)));
      setUserEdits((prev) => ({
        ...prev,
        [userId]: {
          username,
          password: ''
        }
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyUserId(null);
    }
  }

  function changeUserPage(nextPage) {
    const bounded = Math.max(1, Math.min(nextPage, totalUserPages));
    setUserPage(bounded);
  }

  if (isLoading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="center-column full-height">
          <LoadingSpinner label="Loading admin data..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      {error ? <p className="error">{error}</p> : null}
      {isRefreshing ? <p className="meta-note">Refreshing data...</p> : null}
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
          <button type="submit" disabled={busyTeacher}>
            {busyTeacher ? <LoadingSpinner size="sm" label="Creating..." /> : 'Create Teacher'}
          </button>
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
          <fieldset>
            <legend>Subjects</legend>
            <div className="checkbox-grid">
            {SUBJECT_OPTIONS.map((subject) => (
              <label key={subject} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={examForm.subjects.includes(subject)}
                  onChange={(e) => {
                    setExamForm((prev) => ({
                      ...prev,
                      subjects: e.target.checked
                        ? [...prev.subjects, subject]
                        : prev.subjects.filter((item) => item !== subject)
                    }));
                  }}
                />
                {subject}
              </label>
            ))}
            </div>
          </fieldset>
          <button type="submit" disabled={busyExam}>
            {busyExam ? <LoadingSpinner size="sm" label="Saving..." /> : 'Save Exam'}
          </button>
        </form>
      </section>

      <section className="card">
        <h3>Manage Users</h3>
        <p className="meta-note">Update name/username and set a new password for any account.</p>
        <div className="grid-3">
          <label>
            Search
            <input
              placeholder="Search by id, username, role, class, roll"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
            />
          </label>
          <label>
            Rows per page
            <select
              value={userPageSize}
              onChange={(e) => {
                const size = Number(e.target.value) || 10;
                setUserPageSize(size);
                setUserPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <div>
            <p className="meta-note">
              Showing {filteredUsers.length ? userStartIndex + 1 : 0}–
              {Math.min(userStartIndex + userPageSize, filteredUsers.length)} of {filteredUsers.length}
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Role</th>
                <th>Class</th>
                <th>Roll</th>
                <th>Name / Username</th>
                <th>New Password</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.role}</td>
                  <td>{user.class || '-'}</td>
                  <td>{user.rollnumber || '-'}</td>
                  <td>
                    <input
                      value={userEdits[user.id]?.username ?? user.username}
                      onChange={(e) => {
                        const value = e.target.value;
                        setUserEdits((prev) => ({
                          ...prev,
                          [user.id]: {
                            username: value,
                            password: prev[user.id]?.password || ''
                          }
                        }));
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="password"
                      placeholder="Leave blank to keep"
                      value={userEdits[user.id]?.password ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setUserEdits((prev) => ({
                          ...prev,
                          [user.id]: {
                            username: prev[user.id]?.username ?? user.username,
                            password: value
                          }
                        }));
                      }}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => updateUser(user.id)}
                      disabled={busyUserId === user.id}
                    >
                      {busyUserId === user.id ? <LoadingSpinner size="sm" label="Saving..." /> : 'Update'}
                    </button>
                  </td>
                </tr>
              ))}
              {!pagedUsers.length ? (
                <tr>
                  <td colSpan="7">No users found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={() => changeUserPage(safeUserPage - 1)} disabled={safeUserPage <= 1}>
            Prev
          </button>
          <span className="meta-note">
            Page {safeUserPage} / {totalUserPages}
          </span>
          <button
            type="button"
            onClick={() => changeUserPage(safeUserPage + 1)}
            disabled={safeUserPage >= totalUserPages}
          >
            Next
          </button>
        </div>
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
                    <button
                      type="button"
                      onClick={() => togglePublish(exam)}
                      disabled={busyToggleId === exam.examid}
                    >
                      {busyToggleId === exam.examid ? (
                        <LoadingSpinner size="sm" label="Updating..." />
                      ) : published ? 'Unpublish' : 'Publish'}
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
