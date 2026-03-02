# Backend API (SMS)

Node.js + Express backend for the School Management System.

## Stack

- Express 5
- PostgreSQL (`pg`)
- Session auth (`express-session` + `passport`)
- Password hashing (`bcrypt`)

## Prerequisites

- Node.js 18+
- PostgreSQL
- Valid environment variables in `backend/.env`

## Environment Variables

Backend reads config from `backend/.env`.

Required/important keys:

- `PORT` (default: `4000`)
- `FRONTEND_URL` (default: `http://localhost:5173`)
- `SESSION_SECRET`
- `DATABASE_URL` (preferred in production)

Optional local DB keys (if `DATABASE_URL` not set):

- `DB_USER`
- `DB_HOST`
- `DB_NAME`
- `DB_PASSWORD`
- `DB_PORT`

Optional DB seed keys used by reset script:

- `ADMIN_USERNAME` (default: `admin`)
- `ADMIN_PASSWORD` (default: `admin123`)

## Install

From project root:

```bash
npm run install:all
```

Or only backend:

```bash
npm install --prefix backend
```

## Run Backend

From root:

```bash
npm run dev:backend
```

Or from backend folder:

```bash
npm run dev
```

Health endpoint:

- `GET /health`

## Database Commands

Initialize schema only:

```bash
npm run db:init
```

Reset everything (drop all app tables, recreate, seed admin user):

```bash
npm run db:reset
```

Reset drops these tables if present:

- `student_scores`
- `tests`
- `exams`
- `users`

## Auth Model

- Session/cookie based authentication
- Cookie name: `sms.sid`
- Role-based access: `admin`, `teacher`, `student`

## API Routes

Base prefix: `/api`

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/teachers`
- `POST /api/admin/teachers`
- `GET /api/admin/students`
- `GET /api/admin/exams`
- `POST /api/admin/exams` (dynamic exam creation/update)
- `POST /api/admin/exams/publish`
- `POST /api/admin/exams/unpublish`

### Teacher

- `GET /api/teacher/dashboard`
- `GET /api/teacher/students`
- `GET /api/teacher/students/:studentId/profile`
- `POST /api/teacher/students`
- `GET /api/teacher/tests/:examId`
- `POST /api/teacher/tests` (dynamic subject/test creation)
- `GET /api/teacher/marks/:examId`
- `POST /api/teacher/marks`

### Student

- `GET /api/student/dashboard`

## Notes

- Report card generation is dynamic from DB exams/tests/weightage (not hardcoded).
- `src/server.js` currently does **not** auto-run schema initialization on startup; use `db:init` or `db:reset` explicitly.
