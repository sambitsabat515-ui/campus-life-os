# AGENTS.md — Campus Life OS Project Memory & Conventions

## 1. What This Product Does
Campus Life OS is a unified, offline-first campus operations platform purpose-built for Indian universities (specifically BPUT, Rourkela). It consolidates hostel management, gate pass issuance with two-tier warden/guard approval, AI complaint auto-routing & recurring issue pattern detection, targeted notice dissemination with SMS fallback, 3D campus navigation, and mess feedback into a single resilient platform.

## 2. Immutable Stack (Do NOT Change)
- **Backend**: Python 3.11+ with FastAPI, SQLAlchemy ORM, Pydantic v2.
- **Database**: SQLite3 (Local, zero-external-dependency for hackathon/evaluation) with Postgres-compatible schema.
- **Frontend**: React 18 (Vite SPA) + Vanilla CSS Design Tokens (Custom Purple Theme: `#8B2072` primary).
- **3D Graphics**: Three.js with GLTFLoader, OrbitControls, and custom WebGL Pepper's Ghost Hologram mode.
- **AI / Agents**: Hand-crafted deterministic rule & pattern-memory agents in pure Python (NO LangChain, NO external LLM API hard dependencies).
- **Containerization**: Docker & Docker Compose (`docker-compose up` runs full stack).

## 3. Core Development Rules
1. **Never Commit Secrets**: All sensitive keys go into environment variables documented in `.env.example`.
2. **Server is Source of Truth**: All validation (Pydantic), authorization (RBAC), and business rules must be enforced on the backend. Frontend UI gating is strictly for UX.
3. **Structured Errors**: Every API endpoint returns errors conforming to the standard error envelope:
   `{"error": {"code": "ERROR_CODE", "message": "Human readable message", "request_id": "uuid", "details": {}}}`
4. **Thin Route Handlers**: Route handlers in `backend/app/api/` handle HTTP parsing and authorization; domain logic resides in agents and service layers.
5. **No Regressions**: Always run the automated test suite (`pytest`) and frontend build (`npm run build`) before considering any task complete.
6. **Zero Leaked PII / Passwords in Logs**: Structured logger must automatically redact `password`, `token`, `secret`, and `authorization` fields.

## 4. Standard Commands
- **Backend Dev Server**: `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Run Backend Tests**: `cd backend && python -m pytest`
- **Frontend Dev Server**: `cd frontend && npm run dev`
- **Frontend Production Build**: `cd frontend && npm run build`
- **Run Full Docker Stack**: `docker-compose up --build`
- **Database Backup Verification**: `python backend/scripts/backup_db.py`

## 5. Architecture Decisions Log
All architectural decisions are formally documented in [`docs/decisions/`](file:///c:/Users/HP/OneDrive/Desktop/ps7/docs/decisions/):
- `0001-modular-monolith-fastapi-react.md`
- `0002-hand-built-deterministic-agents-vs-frameworks.md`
- `0003-hybrid-offline-voice-sms-fallback.md`
- `0004-sqlite-zero-external-dependency-to-postgres-roadmap.md`
