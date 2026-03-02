import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { apiRequest } from '../api/client.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

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
  const [roleFilter, setRoleFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [busyTeacher, setBusyTeacher] = useState(false);
  const [busyExam, setBusyExam] = useState(false);
  const [busyToggleId, setBusyToggleId] = useState(null);
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [previousStats, setPreviousStats] = useState({ teachers: 0, students: 0, published: 0 });
  const [currentStats, setCurrentStats] = useState({ teachers: 0, students: 0, published: 0 });
  const [form, setForm] = useState({ username: '', password: '' });
  const [promotionForm, setPromotionForm] = useState(() => {
    const now = new Date();
    return {
      graduatingClass: '12',
      archiveLabel: `${now.getFullYear()}-${now.getFullYear() + 1}`
    };
  });
  const [promotionResult, setPromotionResult] = useState(null);
  const [busyPromotion, setBusyPromotion] = useState(false);
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
  const uniqueClasses = useMemo(() => {
    const values = new Set(users.map((user) => user.class).filter(Boolean));
    return Array.from(values).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }, [users]);
  const uniqueRoles = useMemo(() => {
    const values = new Set(users.map((user) => user.role).filter(Boolean));
    return Array.from(values).sort();
  }, [users]);
  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }

    if (classFilter !== 'all' && String(user.class || '') !== classFilter) {
      return false;
    }

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
  const teacherFormErrors = {
    username: form.username.trim().length > 0 && form.username.trim().length < 3,
    password: form.password.length > 0 && form.password.length < 6
  };
  const isTeacherFormValid = form.username.trim().length >= 3 && form.password.length >= 6;

  function showToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }

  function statTrend(current, previous) {
    const delta = current - previous;
    if (delta > 0) {
      return `+${delta} this refresh`;
    }

    if (delta < 0) {
      return `${delta} this refresh`;
    }

    return 'No change';
  }

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
      const nextStats = {
        teachers: dashboardResult?.teachers?.length || 0,
        students: dashboardResult?.students?.length || 0,
        published: examsResult.filter((exam) => isPublished(exam.is_published)).length
      };
      setPreviousStats(currentStats);
      setCurrentStats(nextStats);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
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
    if (!isTeacherFormValid) {
      setError('Use at least 3 characters for username and 6 for password');
      return;
    }

    setBusyTeacher(true);
    try {
      await apiRequest('/api/admin/teachers', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setForm({ username: '', password: '' });
      showToast('Teacher account created');
      await loadDashboard();
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
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
      showToast(nextPublished ? 'Exam published' : 'Exam unpublished');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
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
      showToast('Exam created successfully');
      await loadDashboard();
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setBusyExam(false);
    }
  }

  async function runPromotion(event) {
    event.preventDefault();
    setError('');

    const graduatingClass = String(promotionForm.graduatingClass || '').trim();
    const archiveLabel = String(promotionForm.archiveLabel || '').trim();

    if (!graduatingClass || !archiveLabel) {
      setError('Graduating class and archive label are required');
      return;
    }

    const shouldProceed = window.confirm(
      `Run promotion workflow now? Students in class ${graduatingClass} will be archived as graduated and other classes will be promoted with new roll numbers.`
    );

    if (!shouldProceed) {
      return;
    }

    setBusyPromotion(true);
    try {
      const response = await apiRequest('/api/admin/promotions/run', {
        method: 'POST',
        body: JSON.stringify({ graduatingClass, archiveLabel })
      });

      setPromotionResult(response);
      showToast(response?.message || 'Promotion workflow completed');
      await loadDashboard();
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setBusyPromotion(false);
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
      showToast('User updated');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setBusyUserId(null);
    }
  }

  function getRoleBadge(role) {
    if (role === 'admin') {
      return 'bg-violet-50 text-violet-700 border-violet-200';
    }

    if (role === 'teacher') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }

    return 'bg-slate-50 text-slate-700 border-slate-200';
  }

  async function confirmTogglePublish() {
    if (!publishTarget) {
      return;
    }

    await togglePublish(publishTarget);
    setPublishTarget(null);
  }

  const statCards = [
    {
      title: 'Teachers',
      value: currentStats.teachers,
      description: 'Active teaching accounts',
      icon: GraduationCap,
      trend: statTrend(currentStats.teachers, previousStats.teachers)
    },
    {
      title: 'Students',
      value: currentStats.students,
      description: 'Registered student accounts',
      icon: Users,
      trend: statTrend(currentStats.students, previousStats.students)
    },
    {
      title: 'Published Exams',
      value: publishedExamCount,
      description: 'Visible to students now',
      icon: ShieldCheck,
      trend: statTrend(currentStats.published, previousStats.published)
    }
  ];

  const navItems = [
    { id: 'summary', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'teacher-form', label: 'Add Teacher', icon: UserPlus },
    { id: 'exam-form', label: 'Create Exam', icon: BookOpen },
    { id: 'promotion-workflow', label: 'Promotion', icon: GraduationCap },
    { id: 'manage-users', label: 'Manage Users', icon: Users },
    { id: 'exam-status', label: 'Exam Status', icon: ClipboardList }
  ];

  function jumpTo(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSidebarOpen(false);
    }
  }

  function changeUserPage(nextPage) {
    const bounded = Math.max(1, Math.min(nextPage, totalUserPages));
    setUserPage(bounded);
  }

  if (isLoading) {
    return (
      <Layout title="Admin Dashboard" fullWidth>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
            <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
          </div>
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <LoadingSpinner label="Loading admin data..." />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard" fullWidth>
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

        <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Admin Panels</p>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => jumpTo(item.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
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
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => jumpTo(item.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-6">
            <section id="summary" className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <p className="text-xs font-medium text-slate-500">Dashboard</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">School Admin Dashboard</h2>
                    <p className="text-sm text-slate-500">Overview / Admin / Control Center</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => jumpTo('exam-form')}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                    >
                      <BookOpen size={16} />
                      Create Exam
                    </button>
                    <button
                      type="button"
                      onClick={() => jumpTo('teacher-form')}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <UserPlus size={16} />
                      Add Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => jumpTo('promotion-workflow')}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <GraduationCap size={16} />
                      Run Promotion
                    </button>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">{card.title}</p>
                          <h3 className="mt-1 text-3xl font-bold text-slate-900">{card.value}</h3>
                        </div>
                        <span className="inline-flex rounded-xl bg-brand-50 p-2 text-brand-600">
                          <Icon size={18} />
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{card.description}</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <ArrowUpRight size={14} />
                        {card.trend}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <form
                id="teacher-form"
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
                onSubmit={addTeacher}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Add Teacher</h3>
                    <p className="text-sm text-slate-500">Create a teacher login account</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Username</span>
                    <input
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100 ${
                        teacherFormErrors.username ? 'border-rose-300' : 'border-slate-300'
                      }`}
                      value={form.username}
                      onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="teacher username"
                      required
                    />
                    {teacherFormErrors.username ? (
                      <p className="text-xs text-rose-600">Username must be at least 3 characters</p>
                    ) : (
                      <p className="text-xs text-emerald-600">Looks good</p>
                    )}
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Password</span>
                    <div className="relative">
                      <input
                        type={showTeacherPassword ? 'text' : 'password'}
                        className={`w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-brand-100 ${
                          teacherFormErrors.password ? 'border-rose-300' : 'border-slate-300'
                        }`}
                        value={form.password}
                        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="minimum 6 characters"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500"
                        onClick={() => setShowTeacherPassword((prev) => !prev)}
                        aria-label={showTeacherPassword ? 'Hide password' : 'Show password'}
                      >
                        {showTeacherPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {teacherFormErrors.password ? (
                      <p className="text-xs text-rose-600">Password must be at least 6 characters</p>
                    ) : (
                      <p className="text-xs text-emerald-600">Strong enough for school use</p>
                    )}
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={busyTeacher || !isTeacherFormValid}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyTeacher ? (
                    <LoadingSpinner size="sm" label="Creating..." />
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Create Teacher
                    </>
                  )}
                </button>
              </form>

              <form
                id="exam-form"
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
                onSubmit={addExam}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Create Exam</h3>
                    <p className="text-sm text-slate-500">Set details and select subjects</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Exam Name</span>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                      value={examForm.exam_name}
                      onChange={(e) => setExamForm((prev) => ({ ...prev, exam_name: e.target.value }))}
                      required
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Class</span>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                      value={examForm.class}
                      onChange={(e) => setExamForm((prev) => ({ ...prev, class: e.target.value }))}
                      required
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Exam Type</span>
                    <select
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                      value={examForm.testtype}
                      onChange={(e) => setExamForm((prev) => ({ ...prev, testtype: e.target.value }))}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="term">Term</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Weightage (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                      value={examForm.weightage}
                      onChange={(e) => setExamForm((prev) => ({ ...prev, weightage: e.target.value }))}
                      required
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Max Theory</span>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                      value={examForm.max_theory}
                      onChange={(e) => setExamForm((prev) => ({ ...prev, max_theory: e.target.value }))}
                      required
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Max Practical</span>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                      value={examForm.max_practical}
                      onChange={(e) => setExamForm((prev) => ({ ...prev, max_practical: e.target.value }))}
                      required
                    />
                  </label>
                </div>

                <div className="my-5 border-t border-slate-200" />

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Subjects</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {SUBJECT_OPTIONS.map((subject) => (
                      <label
                        key={subject}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-brand-600"
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
                        <span className="capitalize">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="sticky bottom-0 mt-5 rounded-xl border border-slate-200 bg-white/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
                  <button
                    type="submit"
                    disabled={busyExam}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyExam ? (
                      <LoadingSpinner size="sm" label="Saving..." />
                    ) : (
                      <>
                        <Save size={16} />
                        Save Exam
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <section id="promotion-workflow" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <form className="space-y-4" onSubmit={runPromotion}>
                <div className="mb-1 flex items-center gap-2">
                  <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Promotion Workflow</h3>
                    <p className="text-sm text-slate-500">End-of-year promotion with roll regeneration and archive</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Graduating Class</span>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                      value={promotionForm.graduatingClass}
                      onChange={(e) =>
                        setPromotionForm((prev) => ({
                          ...prev,
                          graduatingClass: e.target.value
                        }))
                      }
                      placeholder="12"
                      required
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700">Archive Label</span>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                      value={promotionForm.archiveLabel}
                      onChange={(e) =>
                        setPromotionForm((prev) => ({
                          ...prev,
                          archiveLabel: e.target.value
                        }))
                      }
                      placeholder="2026-2027"
                      required
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={busyPromotion}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyPromotion ? <LoadingSpinner size="sm" label="Running..." /> : <><GraduationCap size={16} />Run Promotion</>}
                </button>
              </form>

              {promotionResult?.summary ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-800">Last run: {promotionResult.archiveLabel}</p>
                  <p className="mt-1">
                    Total: {promotionResult.summary.total} · Promoted: {promotionResult.summary.promoted} · Graduated:{' '}
                    {promotionResult.summary.graduated}
                  </p>
                  <p className="mt-1">
                    Skipped (invalid class): {promotionResult.summary.skippedInvalidClass} · Skipped (above graduation):{' '}
                    {promotionResult.summary.skippedAboveGraduation}
                  </p>
                </div>
              ) : null}
            </section>

            <section id="manage-users" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Manage Users</h3>
                  <p className="text-sm text-slate-500">Edit username and reset passwords securely</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {filteredUsers.length} users
                </span>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="relative block">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                    placeholder="Search by id, role, class"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                  />
                </label>
                <label className="relative block">
                  <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                  >
                    <option value="all">All roles</option>
                    {uniqueRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                  value={classFilter}
                  onChange={(e) => {
                    setClassFilter(e.target.value);
                    setUserPage(1);
                  }}
                >
                  <option value="all">All classes</option>
                  {uniqueClasses.map((klass) => (
                    <option key={klass} value={klass}>
                      {klass}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-100"
                  value={userPageSize}
                  onChange={(e) => {
                    setUserPageSize(Number(e.target.value) || 10);
                    setUserPage(1);
                  }}
                >
                  <option value={5}>5 rows</option>
                  <option value={10}>10 rows</option>
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                </select>
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="text-left text-slate-600">
                      <th className="px-3 py-2 font-semibold">ID</th>
                      <th className="px-3 py-2 font-semibold">Role</th>
                      <th className="px-3 py-2 font-semibold">Class</th>
                      <th className="px-3 py-2 font-semibold">Roll</th>
                      <th className="px-3 py-2 font-semibold">Name / Username</th>
                      <th className="px-3 py-2 font-semibold">New Password</th>
                      <th className="px-3 py-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((user) => (
                      <tr key={user.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700">{user.id}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{user.class || '-'}</td>
                        <td className="px-3 py-2 text-slate-700">{user.rollnumber || '-'}</td>
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 outline-none transition focus:ring-2 focus:ring-brand-100"
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
                        <td className="px-3 py-2">
                          <input
                            type="password"
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 outline-none transition focus:ring-2 focus:ring-brand-100"
                            placeholder="Leave blank"
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
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            title="Update user"
                            aria-label={`Update user ${user.username}`}
                            onClick={() => updateUser(user.id)}
                            disabled={busyUserId === user.id}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                          >
                            {busyUserId === user.id ? <LoadingSpinner size="sm" label="" /> : <Save size={15} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!pagedUsers.length ? (
                      <tr>
                        <td colSpan="7" className="px-3 py-8 text-center text-slate-500">
                          No users found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {pagedUsers.map((user) => (
                  <article key={user.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">#{user.id}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Class: {user.class || '-'} · Roll: {user.rollnumber || '-'}</p>
                    <div className="mt-3 space-y-2">
                      <input
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100"
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
                      <input
                        type="password"
                        placeholder="New password"
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100"
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
                      <button
                        type="button"
                        onClick={() => updateUser(user.id)}
                        disabled={busyUserId === user.id}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        {busyUserId === user.id ? <LoadingSpinner size="sm" label="Saving..." /> : 'Update User'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  Showing {filteredUsers.length ? userStartIndex + 1 : 0}-
                  {Math.min(userStartIndex + userPageSize, filteredUsers.length)} of {filteredUsers.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeUserPage(safeUserPage - 1)}
                    disabled={safeUserPage <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                    Page {safeUserPage} / {totalUserPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeUserPage(safeUserPage + 1)}
                    disabled={safeUserPage >= totalUserPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </section>

            <section id="exam-status" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Exam Status</h3>
                  <p className="text-sm text-slate-500">Publish controls with live status badges</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {exams.map((exam) => {
                  const published = isPublished(exam.is_published);
                  return (
                    <article key={exam.examid} className="rounded-xl border border-slate-200 p-4 transition hover:shadow-md">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{exam.exam_name}</p>
                          <p className="text-xs text-slate-500">
                            Class {exam.class} · {exam.testtype}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {published ? 'Published' : 'Not Published'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPublishTarget(exam)}
                        disabled={busyToggleId === exam.examid}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        <span
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                            published ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              published ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </span>
                        {busyToggleId === exam.examid ? 'Updating...' : published ? 'Unpublish' : 'Publish'}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(publishTarget)} onClose={() => setPublishTarget(null)} className="relative z-50">
        <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
        <div className="fixed inset-0 grid place-items-center px-4">
          <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <DialogTitle className="text-base font-semibold text-slate-900">Confirm status change</DialogTitle>
            <p className="mt-2 text-sm text-slate-600">
              {publishTarget && isPublished(publishTarget.is_published) ? 'Unpublish' : 'Publish'} exam{' '}
              <span className="font-semibold text-slate-800">{publishTarget?.exam_name}</span> for class{' '}
              {publishTarget?.class}?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPublishTarget(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTogglePublish}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Confirm
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <div className="pointer-events-none fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2 text-sm shadow-lg ${
              toast.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {toast.type === 'error' ? <X size={15} /> : <Check size={15} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </Layout>
  );
}
