# HireTrack AI

Tailor your resume to each job with AI and track every application in one place.
React (Vite) SPA → FastAPI REST API (JWT) → SQLite, with the Claude API for resume matching.

## Features
- **Auth** – email/password sign-up, login, logout (bcrypt + JWT). Every query is scoped to the logged-in user.
- **Resume** – upload a PDF (text is extracted) or paste text; one active resume is used for matching.
- **AI Resume Match** – paste a job description → fit score (0–100), missing skills, three tailored bullets; save as a Wishlist application.
- **Pipeline** – Kanban board (Wishlist → Applied → Interview → Offer, plus Rejected) with drag-and-drop, notes, job link, applied date and interviews.
- **Dashboard** – applications by stage, interviews this week, response rate, upcoming interviews.

## Run it

**Backend** (Python 3.11+):
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then set ANTHROPIC_API_KEY (or AI_PROVIDER=fake)
python seed.py                # optional demo data: demo@hiretrack.ai / demo1234
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

**Frontend** (Node 18+):
```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173 (proxies /api → :8000)
```

**Tests:** `cd backend && .venv/bin/python -m pytest -q`

## Configuration (`backend/.env`)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `sqlite:///./hiretrack.db` by default; switch to a PostgreSQL URL later (install a driver such as `psycopg`) |
| `JWT_SECRET` | Secret for signing tokens — change it |
| `JWT_EXPIRE_MINUTES` | Token lifetime (default 1 day) |
| `AI_PROVIDER` | `claude` (default) or `fake` — an offline keyword matcher for demos without an API key |
| `ANTHROPIC_API_KEY` | Claude API key; only ever read by the backend |
| `CLAUDE_MODEL` | Default `claude-opus-5-5` |
| `CORS_ORIGINS` | Allowed browser origins if the frontend is served from a different origin |

## Product decisions not fixed by the spec
- **Response rate** = applications that reached Interview, Offer or Rejected (or have an interview) ÷ applications sent (has an applied date or is in Applied/Interview/Offer).
- **Interviews this week** = Monday–Sunday of the current week, server local time.
- Moving to Applied (or straight to Interview/Offer) sets `applied_date` to today if empty. Adding an interview to a Wishlist/Applied application moves it to Interview.
- Uploading or pasting a resume makes it the active one; older resumes are kept and can be re-activated.
- Logout is client-side (JWTs are stateless); `/api/auth/logout` exists for symmetry.
