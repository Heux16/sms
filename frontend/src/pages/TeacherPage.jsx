import { Fragment, useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { apiRequest } from '../api/client.js';

export default function TeacherPage() {
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
  const [studentForm, setStudentForm] = useState({ username: '', rollNumber: '', clas: '' });
  const [testForm, setTestForm] = useState({ subject: '' });

  async function loadBaseData() {
    setError('');
    try {
      const [examResult, studentResult] = await Promise.all([
        apiRequest('/api/teacher/dashboard'),
        apiRequest('/api/teacher/students')
      ]);
      setExams(examResult);
      setStudents(studentResult);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadBaseData();
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

    apiRequest(`/api/teacher/tests/${selectedExamId}`)
      .then((result) => {
        setSelectedExam(result.exam);
        setTests(result.tests || []);
      })
      .catch((err) => setError(err.message));

    apiRequest(`/api/teacher/marks/${selectedExamId}`)
      .then((result) => {
        setMarksData(result);
        const initialInputs = {};
        (result.students || []).forEach((student) => {
          initialInputs[student.id] = {
            score_theory: '',
            score_practical: ''
          };
        });
        setMarksInputs(initialInputs);
      })
      .catch((err) => setError(err.message));
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

  async function addStudent(event) {
    event.preventDefault();
    setError('');
    setMessage('');
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
    }
  }

  async function loadStudentProfile(studentId) {
    if (!studentId) {
      setStudentProfile(null);
      return;
    }

    setError('');
    try {
      const result = await apiRequest(`/api/teacher/students/${studentId}/profile`);
      setStudentProfile(result);
    } catch (err) {
      setError(err.message);
    }
  }

  const studentExamOrder = studentProfile?.exams?.map((exam) => exam.exam_name) || [];

  return (
    <Layout title="Teacher Dashboard">
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}
      <section className="grid-2">
        <form className="card" onSubmit={addStudent}>
          <h3>Add Student</h3>
          <input
            placeholder="Student name"
            value={studentForm.username}
            onChange={(e) => setStudentForm((prev) => ({ ...prev, username: e.target.value }))}
            required
          />
          <input
            placeholder="Roll number"
            value={studentForm.rollNumber}
            onChange={(e) => setStudentForm((prev) => ({ ...prev, rollNumber: e.target.value }))}
            required
          />
          <select
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
          <button type="submit">Save Student</button>
        </form>

        <article className="card">
          <h3>Exams</h3>
          <label>
            Select Exam
            <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
              <option value="">-- Select --</option>
              {exams.map((exam) => (
                <option key={exam.examid} value={exam.examid}>
                  {exam.exam_name} ({exam.class})
                </option>
              ))}
            </select>
          </label>
          <ul>
            {exams.map((exam) => (
              <li key={exam.examid}>
                {exam.exam_name} ({exam.class}) - {exam.testtype}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid-2">
        <article className="card">
          <h3>Subjects</h3>
          <p>
            {selectedExam
              ? `${selectedExam.exam_name} (${selectedExam.class}) max: Theory ${selectedExam.max_theory}, Practical ${selectedExam.max_practical}`
              : 'Select an exam to load subject list'}
          </p>
          <ul>
            {tests.map((test) => (
              <li key={test.testid}>{test.subject}</li>
            ))}
          </ul>
          <form onSubmit={addSubject}>
            <input
              placeholder="Add subject"
              value={testForm.subject}
              onChange={(e) => setTestForm({ subject: e.target.value })}
              disabled={!selectedExamId}
              required
            />
            <button type="submit" disabled={!selectedExamId}>
              Add Subject
            </button>
          </form>
        </article>

        <article className="card">
          <h3>All Students</h3>
          <label>
            View Single Student Profile
            <select
              value={selectedStudentId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedStudentId(id);
                loadStudentProfile(id);
              }}
            >
              <option value="">-- Select Student --</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.username} ({student.class}) - {student.rollnumber || 'NA'}
                </option>
              ))}
            </select>
          </label>
          <ul>
            {students.map((student) => (
              <li key={student.id}>
                {student.username} - {student.class} ({student.rollnumber || 'NA'})
              </li>
            ))}
          </ul>
        </article>
      </section>

      {studentProfile ? (
        <section className="card">
          <h3>
            Student Profile: {studentProfile.student.username} ({studentProfile.student.class})
          </h3>
          <p>Roll Number: {studentProfile.student.rollnumber || 'NA'}</p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th rowSpan="2">Subject</th>
                  {studentExamOrder.map((examName) => (
                    <th key={examName} colSpan="4">
                      {examName}
                    </th>
                  ))}
                  <th rowSpan="2">Weighted</th>
                  <th rowSpan="2">Final Grade</th>
                </tr>
                <tr>
                  {studentExamOrder.map((examName) => (
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
                {studentProfile.subjectProfiles.map((profile) => (
                  <tr key={profile.subject}>
                    <td>{profile.subject}</td>
                    {studentExamOrder.map((examName) => (
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
          <p>
            Overall Weighted Score: <strong>{studentProfile.overall.weightedScore}</strong> | Overall Grade:{' '}
            <strong>{studentProfile.overall.grade}</strong>
          </p>
        </section>
      ) : null}

      <form className="card" onSubmit={saveMarks}>
        <h3>Set Marks</h3>
        <label>
          Select Test
          <select value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)} disabled={!tests.length}>
            <option value="">-- Select Test --</option>
            {tests.map((test) => (
              <option key={test.testid} value={test.testid}>
                {test.subject}
              </option>
            ))}
          </select>
        </label>

        {!selectedTestId ? <p>Select a test to enter marks.</p> : null}

        {selectedTestId && marksData.students?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll</th>
                  <th>Theory</th>
                  <th>Practical</th>
                </tr>
              </thead>
              <tbody>
                {marksData.students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.username}</td>
                    <td>{student.rollnumber || 'NA'}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={selectedExam?.max_theory ?? 100}
                        value={marksInputs[student.id]?.score_theory ?? ''}
                        onChange={(e) => updateScore(student.id, 'score_theory', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
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

        <button type="submit" disabled={!selectedTestId}>
          Save Marks
        </button>
      </form>
    </Layout>
  );
}
