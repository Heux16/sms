import { Fragment, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { apiRequest } from '../api/client.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useSEO } from '../components/SEO.jsx';
import { Menu, X } from 'lucide-react';

const PROFILE_SUBJECT_ORDER = [
  'hindi',
  'english',
  'sanskrit',
  'science',
  'sst',
  'kaushal bodh',
  'khel yatra',
  'kriti'
];

export default function TeacherPage() {
  useSEO({
    title: 'Teacher Dashboard',
    description: 'Teacher dashboard for exams, tests, student records, and marks entry.',
    path: '/teacher',
    robots: 'noindex,nofollow'
  });

  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [marksData, setMarksData] = useState({ exam: null, tests: [], students: [] });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [marksInputs, setMarksInputs] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoadingBase, setIsLoadingBase] = useState(true);
  const [isRefreshingBase, setIsRefreshingBase] = useState(false);
  const [isLoadingExamData, setIsLoadingExamData] = useState(false);
  const [busyStudent, setBusyStudent] = useState(false);
  const [busySubject, setBusySubject] = useState(false);
  const [busyMarks, setBusyMarks] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [studentForm, setStudentForm] = useState({ username: '', rollNumber: '', clas: '' });
  const [testForm, setTestForm] = useState({ subject: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [busyPassword, setBusyPassword] = useState(false);
  const [profileClassFilter, setProfileClassFilter] = useState('all');
  const [profilePage, setProfilePage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function loadBaseData({ background = false } = {}) {
    if (background) {
      setIsRefreshingBase(true);
    } else {
      setIsLoadingBase(true);
      setError('');
    }
    try {
      const [examResult, studentResult] = await Promise.all([
        apiRequest('/api/teacher/dashboard'),
        apiRequest('/api/teacher/students')
      ]);
      setExams(examResult);
      setStudents(studentResult);
    } catch (err) {
      setError(err.message);
    } finally {
      if (background) {
        setIsRefreshingBase(false);
      } else {
        setIsLoadingBase(false);
      }
    }
  }

  useEffect(() => {
    loadBaseData();

    const intervalId = setInterval(() => {
      loadBaseData({ background: true });
    }, 20000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!studentForm.clas && exams.length) {
      const classes = [...new Set(exams.map((exam) => exam.class).filter(Boolean))];
      if (classes.length) {
        setStudentForm((prev) => ({ ...prev, clas: classes[0] }));
      }
    }
  }, [exams, studentForm.clas]);

  useEffect(() => {
    if (!selectedExamId) {
      setSelectedExam(null);
      setTests([]);
      setSelectedTestId('');
      setMarksData({ exam: null, tests: [], students: [] });
      setMarksInputs({});
      return;
    }

    setIsLoadingExamData(true);

    Promise.all([
      apiRequest(`/api/teacher/tests/${selectedExamId}`),
      apiRequest(`/api/teacher/marks/${selectedExamId}`)
    ])
      .then(([testsResult, marksResult]) => {
        setSelectedExam(testsResult.exam);
        setTests(testsResult.tests || []);
        setMarksData(marksResult);

        const initialInputs = {};
        (marksResult.students || []).forEach((student) => {
          initialInputs[student.id] = {
            score_theory: '',
            score_practical: ''
          };
        });
        setMarksInputs(initialInputs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoadingExamData(false));
  }, [selectedExamId]);

  useEffect(() => {
    if (!selectedTestId || !marksData.students?.length) {
      return;
    }

    const nextInputs = {};
    marksData.students.forEach((student) => {
      const existing = student.scoresMap?.[selectedTestId];
      nextInputs[student.id] = {
        score_theory: existing?.score_theory ?? '',
        score_practical: existing?.score_practical ?? ''
      };
    });
    setMarksInputs(nextInputs);
  }, [selectedTestId, marksData]);

  useEffect(() => {
    if (!selectedExamId) {
      return;
    }

    if (!tests.length) {
      setSelectedTestId('');
      return;
    }

    const hasSelectedTest = tests.some((test) => String(test.testid) === String(selectedTestId));
    if (!hasSelectedTest) {
      setSelectedTestId(String(tests[0].testid));
    }
  }, [selectedExamId, selectedTestId, tests]);

  async function addStudent(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusyStudent(true);
    try {
      const result = await apiRequest('/api/teacher/students', {
        method: 'POST',
        body: JSON.stringify(studentForm)
      });
      setStudentForm((prev) => ({ ...prev, username: '', rollNumber: '' }));
      setMessage(`Student created. Generated password: ${result.generatedPassword}`);
      await loadBaseData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyStudent(false);
    }
  }

  async function addSubject(event) {
    event.preventDefault();
    if (!selectedExamId) {
      setError('Select an exam first');
      return;
    }

    setError('');
    setMessage('');
    setBusySubject(true);
    try {
      await apiRequest('/api/teacher/tests', {
        method: 'POST',
        body: JSON.stringify({ examid: Number(selectedExamId), subject: testForm.subject })
      });

      setTestForm({ subject: '' });
      const result = await apiRequest(`/api/teacher/tests/${selectedExamId}`);
      setSelectedExam(result.exam);
      setTests(result.tests || []);
      setMessage('Subject added to exam');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusySubject(false);
    }
  }

  function updateScore(studentId, field, value) {
    setMarksInputs((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value
      }
    }));
  }

  async function saveMarks(event) {
    event.preventDefault();
    if (!selectedExamId || !selectedTestId) {
      setError('Please select an exam and test before saving marks');
      return;
    }

    setError('');
    setMessage('');
    setBusyMarks(true);
    try {
      const scores = {};
      Object.entries(marksInputs).forEach(([studentId, values]) => {
        scores[studentId] = {
          id: Number(studentId),
          score_theory: values.score_theory,
          score_practical: values.score_practical
        };
      });

      await apiRequest('/api/teacher/marks', {
        method: 'POST',
        body: JSON.stringify({ examId: selectedExamId, testId: selectedTestId, scores })
      });

      const refreshed = await apiRequest(`/api/teacher/marks/${selectedExamId}`);
      setMarksData(refreshed);
      setMessage('Marks saved successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyMarks(false);
    }
  }

  async function loadStudentProfile(studentId) {
    if (!studentId) {
      setStudentProfile(null);
      return;
    }

    setError('');
    setIsLoadingProfile(true);
    try {
      const result = await apiRequest(`/api/teacher/students/${studentId}/profile`);
      setStudentProfile(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingProfile(false);
    }
  }

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

  const studentExamOrder = studentProfile?.exams?.map((exam) => exam.exam_name) || [];
  const orderedStudentProfileSubjects = useMemo(() => {
    if (!studentProfile?.subjectProfiles?.length) {
      return [];
    }

    const orderIndex = new Map(PROFILE_SUBJECT_ORDER.map((subject, index) => [subject, index]));

    return [...studentProfile.subjectProfiles].sort((first, second) => {
      const firstKey = String(first.subject || '').trim().toLowerCase();
      const secondKey = String(second.subject || '').trim().toLowerCase();
      const firstIndex = orderIndex.has(firstKey) ? orderIndex.get(firstKey) : Number.MAX_SAFE_INTEGER;
      const secondIndex = orderIndex.has(secondKey) ? orderIndex.get(secondKey) : Number.MAX_SAFE_INTEGER;

      if (firstIndex !== secondIndex) {
        return firstIndex - secondIndex;
      }

      return String(first.subject || '').localeCompare(String(second.subject || ''));
    });
  }, [studentProfile]);
  const profilePageSize = 8;
  const profileClasses = useMemo(() => {
    const values = new Set(students.map((student) => student.class).filter(Boolean));
    return Array.from(values).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }, [students]);

  const filteredProfileStudents = useMemo(() => {
    if (profileClassFilter === 'all') {
      return students;
    }

    return students.filter((student) => String(student.class || '') === profileClassFilter);
  }, [students, profileClassFilter]);

  const totalProfilePages = Math.max(1, Math.ceil(filteredProfileStudents.length / profilePageSize));
  const safeProfilePage = Math.min(profilePage, totalProfilePages);
  const profileStartIndex = (safeProfilePage - 1) * profilePageSize;
  const pagedProfileStudents = filteredProfileStudents.slice(profileStartIndex, profileStartIndex + profilePageSize);

  useEffect(() => {
    setProfilePage(1);
  }, [profileClassFilter]);

  useEffect(() => {
    if (!selectedStudentId) {
      return;
    }

    const existsInFiltered = filteredProfileStudents.some(
      (student) => String(student.id) === String(selectedStudentId)
    );

    if (!existsInFiltered) {
      setSelectedStudentId('');
      setStudentProfile(null);
    }
  }, [filteredProfileStudents, selectedStudentId]);

  const navItems = [
    { id: 'teacher-setup', label: 'Setup' },
    { id: 'set-marks', label: 'Set Marks' },
    { id: 'subjects-students', label: 'Subjects & Students' },
    { id: 'student-profile', label: 'Student Profile' },
    { id: 'teacher-password', label: 'Change Password' }
  ];

  function jumpTo(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSidebarOpen(false);
    }
  }

  if (isLoadingBase) {
    return (
      <Layout title="Teacher Dashboard" fullWidth>
        <div className="rounded-2xl bg-slate-50 p-3 sm:p-4 lg:p-6">
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
            <LoadingSpinner label="Loading teacher data..." />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Teacher Dashboard" fullWidth>
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
          {isRefreshingBase ? <span className="text-xs text-slate-500">Refreshing...</span> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Teacher Panels</p>
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
        {message ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
        ) : null}
        {isRefreshingBase ? <p className="text-xs text-slate-500">Refreshing dashboard...</p> : null}

        <section id="teacher-setup" className="grid gap-4 lg:grid-cols-2">
          <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={addStudent}>
            <h3 className="text-lg font-semibold text-slate-900">Add Student</h3>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
              placeholder="Student name"
              value={studentForm.username}
              onChange={(e) => setStudentForm((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
              placeholder="Roll number"
              value={studentForm.rollNumber}
              onChange={(e) => setStudentForm((prev) => ({ ...prev, rollNumber: e.target.value }))}
              required
            />
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
              value={studentForm.clas}
              onChange={(e) => setStudentForm((prev) => ({ ...prev, clas: e.target.value }))}
              required
            >
              <option value="">-- Select Class --</option>
              {[...new Set(exams.map((exam) => exam.class).filter(Boolean))].map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busyStudent}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {busyStudent ? <LoadingSpinner size="sm" label="Saving..." /> : 'Save Student'}
            </button>
          </form>

          <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Exams</h3>
            <label className="block space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Select Exam</span>
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                <option value="">-- Select --</option>
                {exams.map((exam) => (
                  <option key={exam.examid} value={exam.examid}>
                    {exam.exam_name} ({exam.class})
                  </option>
                ))}
              </select>
            </label>
            <ul className="space-y-2 text-sm text-slate-700">
              {exams.map((exam) => (
                <li key={exam.examid} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  {exam.exam_name} ({exam.class}) - {exam.testtype}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <form id="set-marks" className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={saveMarks}>
          <h3 className="text-lg font-semibold text-slate-900">Set Marks</h3>
          <label className="block space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Select Test</span>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              disabled={!tests.length}
            >
              <option value="">-- Select Test --</option>
              {tests.map((test) => (
                <option key={test.testid} value={test.testid}>
                  {test.subject}
                </option>
              ))}
            </select>
          </label>

          {!selectedExamId ? <p className="text-sm text-slate-600">Select an exam first to load marks entry.</p> : null}
          {selectedExamId && !tests.length ? (
            <p className="text-sm text-slate-600">No tests/subjects found for this exam. Add a subject first.</p>
          ) : null}

          {!selectedTestId ? <p className="text-sm text-slate-600">Select a test to enter marks.</p> : null}
          {selectedTestId && !marksData.students?.length ? (
            <p className="text-sm text-slate-600">No students found in this exam class yet.</p>
          ) : null}

          {selectedTestId && marksData.students?.length ? (
            <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-max w-full border-collapse text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Student</th>
                    <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Roll</th>
                    <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Theory</th>
                    <th className="border border-slate-200 px-3 py-2 text-left font-semibold">Practical</th>
                  </tr>
                </thead>
                <tbody>
                  {marksData.students.map((student) => (
                    <tr key={student.id} className="bg-white">
                      <td className="border border-slate-200 px-3 py-2">{student.username}</td>
                      <td className="border border-slate-200 px-3 py-2">{student.rollnumber || 'NA'}</td>
                      <td className="border border-slate-200 px-3 py-2">
                        <input
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                          type="number"
                          min="0"
                          max={selectedExam?.max_theory ?? 100}
                          value={marksInputs[student.id]?.score_theory ?? ''}
                          onChange={(e) => updateScore(student.id, 'score_theory', e.target.value)}
                        />
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        <input
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                          type="number"
                          min="0"
                          max={selectedExam?.max_practical ?? 100}
                          value={marksInputs[student.id]?.score_practical ?? ''}
                          onChange={(e) => updateScore(student.id, 'score_practical', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!selectedTestId || busyMarks}
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busyMarks ? <LoadingSpinner size="sm" label="Saving marks..." /> : 'Save Marks'}
          </button>
        </form>

        <section id="subjects-students" className="grid gap-4 lg:grid-cols-2">
          <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Subjects</h3>
            <p className="text-sm text-slate-600">
              {selectedExam
                ? `${selectedExam.exam_name} (${selectedExam.class}) max: Theory ${selectedExam.max_theory}, Practical ${selectedExam.max_practical}`
                : 'Select an exam to load subject list'}
            </p>
            {isLoadingExamData ? <LoadingSpinner size="sm" label="Loading exam details..." /> : null}
            <ul className="space-y-2 text-sm text-slate-700">
              {tests.map((test) => (
                <li key={test.testid} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 capitalize">
                  {test.subject}
                </li>
              ))}
            </ul>
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={addSubject}>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                placeholder="Add subject"
                value={testForm.subject}
                onChange={(e) => setTestForm({ subject: e.target.value })}
                disabled={!selectedExamId}
                required
              />
              <button
                type="submit"
                disabled={!selectedExamId || busySubject}
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {busySubject ? <LoadingSpinner size="sm" label="Adding..." /> : 'Add Subject'}
              </button>
            </form>
          </article>

          <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">All Students</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block space-y-1 text-sm text-slate-600">
                <span className="font-medium text-slate-700">Filter by Class</span>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                  value={profileClassFilter}
                  onChange={(e) => setProfileClassFilter(e.target.value)}
                >
                  <option value="all">All Classes</option>
                  {profileClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end text-xs text-slate-500">
                Showing {filteredProfileStudents.length ? profileStartIndex + 1 : 0}-
                {Math.min(profileStartIndex + profilePageSize, filteredProfileStudents.length)} of{' '}
                {filteredProfileStudents.length}
              </div>
            </div>
            <label className="block space-y-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">View Single Student Profile</span>
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                value={selectedStudentId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedStudentId(id);
                  loadStudentProfile(id);
                }}
              >
                <option value="">-- Select Student --</option>
                {filteredProfileStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.username} ({student.class}) - {student.rollnumber || 'NA'}
                  </option>
                ))}
              </select>
            </label>
            <ul className="space-y-2 text-sm text-slate-700">
              {pagedProfileStudents.map((student) => (
                <li key={student.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  {student.username} - {student.class} ({student.rollnumber || 'NA'})
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setProfilePage((prev) => Math.max(1, prev - 1))}
                disabled={safeProfilePage <= 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs font-semibold text-slate-600">
                Page {safeProfilePage} / {totalProfilePages}
              </span>
              <button
                type="button"
                onClick={() => setProfilePage((prev) => Math.min(totalProfilePages, prev + 1))}
                disabled={safeProfilePage >= totalProfilePages}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </article>
        </section>

        {isLoadingProfile ? <p className="text-xs text-slate-500">Loading student profile...</p> : null}

        {studentProfile ? (
          <section id="student-profile" className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Student Profile: {studentProfile.student.username} ({studentProfile.student.class})
            </h3>
            <p className="text-sm text-slate-600">Roll Number: {studentProfile.student.rollnumber || 'NA'}</p>

            <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-max w-full border-collapse text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th rowSpan="2" className="border border-slate-200 px-3 py-2 text-left font-semibold">Subject</th>
                    {studentExamOrder.map((examName) => (
                      <th key={examName} colSpan="4" className="border border-slate-200 px-3 py-2 text-left font-semibold">
                        {examName}
                      </th>
                    ))}
                    <th rowSpan="2" className="border border-slate-200 px-3 py-2 text-left font-semibold">Weighted</th>
                    <th rowSpan="2" className="border border-slate-200 px-3 py-2 text-left font-semibold">Final Grade</th>
                  </tr>
                  <tr>
                    {studentExamOrder.map((examName) => (
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
                  {orderedStudentProfileSubjects.map((profile) => (
                    <tr key={profile.subject} className="bg-white">
                      <td className="border border-slate-200 px-3 py-2">{profile.subject}</td>
                      {studentExamOrder.map((examName) => (
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
            <p className="text-sm text-slate-700">
              Overall Weighted Score: <strong>{studentProfile.overall.weightedScore}</strong> | Overall Grade:{' '}
              <strong>{studentProfile.overall.grade}</strong>
            </p>
          </section>
        ) : null}

        <section id="teacher-password" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
