# UNGRADED Backend

Node.js + Express + MongoDB API for the UNGRADED frontend.

## Setup

1. Install [MongoDB](https://www.mongodb.com/try/download/community) locally (or use MongoDB Atlas).
2. Copy env file:

```bash
cp .env.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm run dev
```

API runs at `http://localhost:5000`. Courses are auto-seeded on first start.

## Demo auth

- OTP is always **`123456`** (set `DEMO_OTP` in `.env`).
- JWT tokens expire in 30 days.

## API routes

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/send-otp` | No |
| POST | `/api/auth/verify-otp` | No |
| GET | `/api/auth/me` | Yes |
| PATCH | `/api/auth/profile` | Yes |
| GET | `/api/courses` | No |
| GET | `/api/courses/:id` | No |
| GET | `/api/enrollments` | Yes |
| POST | `/api/enrollments` | Yes |
| POST | `/api/enrollments/counselling` | Yes |

## Frontend

From `frontend/` folder, run `npm run dev`. Vite proxies `/api` to this server.
