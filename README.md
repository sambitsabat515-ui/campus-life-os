# Campus Life OS — BPUT Hackathon 2026 (Problem Statement 07)

> *"Four apps, six notice boards, two WhatsApp groups and one paper register. Replace all of it."*

Campus Life OS is a unified, offline-first campus operations platform purpose-built for Indian universities (specifically BPUT, Rourkela). It consolidates maintenance complaint ticketing, two-tier warden/guard gate pass issuance, targeted academic notices with SMS fallback, multilingual voice intent routing, 3D interactive campus navigation, and mess operations into a single resilient system.

[![CI Pipeline](https://github.com/sambitsabat515-ui/campus-life-os/actions/workflows/ci.yml/badge.svg)](https://github.com/sambitsabat515-ui/campus-life-os/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160-black.svg)](https://threejs.org/)

---

## 🌟 Key Capabilities & Evaluation Highlights

- **Friction Reduction (30% Evaluation Weight):** Single interface for routine tasks — complaints, gate passes, certificates, mess menus, and class timetables.
- **Completeness of Workflows (20%):** 4 distinct portals (`STUDENT`, `STAFF`, `ADMIN`, `MESS`) with isolated route trees and zero role-based hiding.
- **Admin Visibility & SLA Tracking (20%):** Real-time ageing heatmap (`>24h`, `>48h`, `>72h`), staff workload distribution, and deterministic recurring issue detection.
- **Accessibility & Fault Tolerance (15%):**
  - **Low-Bandwidth Mode:** Instant toggle stripping 3D scenes for 2G/3G networks.
  - **SMS Webhook Fallback:** Processes `COMPLAINT <text>`, `ATTENDANCE`, `MENU TODAY`, `STATUS <id>` on `/api/sms-webhook`.
  - **Multilingual Offline Voice Agent:** English, Hindi, and Odia support with honest local model degradation diagnostics.
- **Demo-Quality Wow Factor (15%):**
  - **Campus Quest 3D:** Three.js turn-by-turn navigation with animated route markers and synced checklist styled in our signature `#8B2072` purple theme.
  - **Campus X-Ray View:** Real-time glowing beacons on buildings pulsing by complaint severity.
  - **Pepper's Ghost Hologram Mode:** 4-view inverted 45° projection for physical acrylic/plastic pyramids.
  - **WebAR Support:** Google `<model-viewer>` WebXR experience.
  - **Ask Campus Intent Layer:** Single natural language front-door coordinating real institutional workflows with raw explainability.

---

## 🚀 Quick Start

### Option A: Local Development (Fastest)

#### 1. Backend (Python FastAPI + SQLite)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- Web Application & Frontend SPA: `http://localhost:8000/` (Served directly from unified backend)
- Interactive API Documentation: `http://localhost:8000/docs`
- Subsystem Health Check: `http://localhost:8000/api/health`
- Database: Automatically seeds realistic campus data on first startup!

#### 2. Frontend Development Server (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
- Vite Dev Server: `http://localhost:5173/`

#### 3. Run Automated Tests
```bash
cd backend
python -m pytest -v
```
All 12 unit, integration, and SaaS hardening tests pass with 100% success rate!

---

### Option B: Docker Compose (Single Command)
```bash
docker-compose up --build
```
Runs both backend and frontend services simultaneously in isolated production containers.

---

### Option C: Wasmer Edge Deployment (WebAssembly)
```bash
wasmer deploy
```
Deploys the React SPA and Three.js 3D assets to Wasmer's global serverless edge network.
*See complete guide: [`docs/runbooks/wasmer-deploy.md`](docs/runbooks/wasmer-deploy.md)*.

---

## 👥 Demo Logins & Personas

| Role | Roll / Email | Password | Key Workflows to Test |
| :--- | :--- | :--- | :--- |
| **Student (Aarav Sharma)** | `2201106042` / `student@campus.edu` | `demo123` | Tap complaint, gate pass QR generator, 3D Campus Quest, Ask Campus bar |
| **Warden (Dr. S. Mohapatra)**| `warden@campus.edu` | `warden123` | Approve gate pass requests, resolve overdue complaints, track hostel curfew |
| **Admin (Dean Academics)** | `admin@campus.edu` | `admin123` | Control Tower KPIs, 24h ageing heatmap, recurring issue clusters, broadcast notices |
| **Mess Manager (Chef Patnaik)**| `mess@campus.edu` | `mess123` | Today's meal menu, student food satisfaction ratings, grocery stock alerts |
| **Security Guard (Gate #1)** | `guard@campus.edu` | `guard123` | Real-time QR scanner for gate departure & entry verification |

---

## 📂 Project Directory Structure

Click on any folder or document link to explore the implementation:

```
campus-life-os/
├── [backend/](backend/)                         # Python 3.11+ FastAPI Server & Hand-built Agents
│   ├── [app/](backend/app/)                     # Application Core
│   │   ├── [main.py](backend/app/main.py)       # FastAPI app, security headers, rate limiting & error handling
│   │   ├── [config.py](backend/app/config.py)   # Settings, environment validation & thresholds
│   │   ├── [schemas.py](backend/app/schemas.py) # Strict Pydantic v2 validation models
│   │   ├── [db/](backend/app/db/)               # Database Layer (SQLAlchemy ORM + Seed)
│   │   │   ├── [models.py](backend/app/db/models.py)   # Relational schema (Complaints, Passes, Notices)
│   │   │   ├── [session.py](backend/app/db/session.py) # SQLite & PostgreSQL session engine
│   │   │   └── [seed.py](backend/app/db/seed.py)       # Realistic BPUT campus seed generator
│   │   ├── [auth/](backend/app/auth/)           # Portal-Isolated Authentication & RBAC
│   │   │   ├── [routes.py](backend/app/auth/routes.py)     # JWT login & registration endpoints
│   │   │   └── [security.py](backend/app/auth/security.py) # can() central authorization & password hashing
│   │   ├── [agents/](backend/app/agents/)       # Hand-Crafted Deterministic Agents (No LLM Frameworks)
│   │   │   ├── [base.py](backend/app/agents/base.py)                     # Agent & AgentResult base classes
│   │   │   ├── [complaint_routing_agent.py](backend/app/agents/complaint_routing_agent.py) # Keyword & SLA routing
│   │   │   ├── [pattern_memory_agent.py](backend/app/agents/pattern_memory_agent.py)       # Temporal cluster detection
│   │   │   ├── [faq_chatbot_agent.py](backend/app/agents/faq_chatbot_agent.py)             # 20 canonical Q&As
│   │   │   ├── [voice_intent_agent.py](backend/app/agents/voice_intent_agent.py)           # Multilingual phonetic intent router
│   │   │   ├── [intent_agent.py](backend/app/agents/intent_agent.py)                       # Ask Campus NLP coordinator
│   │   │   └── [policy_agent.py](backend/app/agents/policy_agent.py)                       # Rule-based gate pass policy
│   │   └── [api/](backend/app/api/)             # Thin HTTP Route Handlers
│   │       ├── [routes_student.py](backend/app/api/routes_student.py) # Student complaints, passes, timetable
│   │       ├── [routes_staff.py](backend/app/api/routes_staff.py)     # Technician work orders & warden actions
│   │       ├── [routes_admin.py](backend/app/api/routes_admin.py)     # Control Tower & notice broadcast
│   │       ├── [routes_mess.py](backend/app/api/routes_mess.py)       # Meal headcount & ratings
│   │       ├── [routes_voice.py](backend/app/api/routes_voice.py)     # Multilingual voice agent processing
│   │       ├── [routes_sms.py](backend/app/api/routes_sms.py)         # GSM SMS command fallback gateway
│   │       ├── [routes_map.py](backend/app/api/routes_map.py)         # 3D navigation & X-Ray complaint beacons
│   │       └── [routes_ask.py](backend/app/api/routes_ask.py)         # Ask Campus intent submission
│   ├── [scripts/](backend/scripts/)             # Operational Scripts
│   │   └── [backup_db.py](backend/scripts/backup_db.py) # Online atomic database backup & integrity test
│   ├── [tests/](backend/tests/)                 # 12 Comprehensive Pytest Suites
│   ├── [requirements.txt](backend/requirements.txt)
│   ├── [.env.example](backend/.env.example)
│   └── [Dockerfile](backend/Dockerfile)
│
├── [frontend/](frontend/)                       # React 18 SPA + Vanilla CSS Design Tokens
│   ├── [src/](frontend/src/)                    # Source Code
│   │   ├── [design-tokens.css](frontend/src/design-tokens.css) # Custom Purple Design Tokens (#8B2072)
│   │   ├── [App.jsx](frontend/src/App.jsx)                     # Role-based route routing
│   │   ├── [map/](frontend/src/map/)                           # 3D Campus Navigation
│   │   │   └── [CampusMapViewer.jsx](frontend/src/map/CampusMapViewer.jsx) # Three.js GLB Map, X-Ray, Hologram
│   │   ├── [mobile/](frontend/src/mobile/)                     # Mobile-first student experience
│   │   ├── [desktop/](frontend/src/desktop/)                   # Wide-screen responsive desktop layouts
│   │   ├── [admin/](frontend/src/admin/)                       # Administrator Control Tower (10 views)
│   │   ├── [staff/](frontend/src/staff/)                       # Technician & Warden dashboard
│   │   ├── [mess/](frontend/src/mess/)                         # Mess manager operations console
│   │   ├── [voice/](frontend/src/voice/)                       # Floating multilingual mic agent modal
│   │   ├── [ask/](frontend/src/ask/)                           # Ask Campus intent bar with raw explainability
│   │   └── [lib/api.js](frontend/src/lib/api.js)               # Centralized frontend API client
│   ├── [public/](frontend/public/)              # Static Assets
│   │   └── [campus_bput.glb](frontend/public/campus_bput.glb)  # Real BPUT Campus 3D Model (864 KB)
│   ├── [package.json](frontend/package.json)
│   ├── [vite.config.js](frontend/vite.config.js)
│   ├── [.env.example](frontend/.env.example)
│   └── [Dockerfile](frontend/Dockerfile)
│
├── [docs/](docs/)                               # Complete Architecture, Design & Runbooks
│   ├── [system-design.md](docs/system-design.md)       # Layer 1: Problem statement, roles & capacity
│   ├── [ARCHITECTURE.md](docs/ARCHITECTURE.md)         # Layer 2: Component diagrams & data flows
│   ├── [permissions.md](docs/permissions.md)           # Layer 4: Role x Action authorization matrix
│   ├── [api-conventions.md](docs/api-conventions.md)   # Layer 5: Standard error envelopes & pagination
│   ├── [testing.md](docs/testing.md)                   # Layer 8: 3-tier testing strategy
│   ├── [hosting.md](docs/hosting.md)                   # Layer 9: Hosting topology & cost model
│   ├── [caching.md](docs/caching.md)                   # Layer 12: Cache-control & invalidation matrix
│   ├── [monitoring.md](docs/monitoring.md)             # Layer 14: Subsystem metrics & health checks
│   ├── [PRE_LAUNCH_CHECKLIST.md](docs/PRE_LAUNCH_CHECKLIST.md) # Appendix B: 16-point pre-launch audit
│   ├── [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)           # Step-by-step hackathon judging script
│   ├── [ADOPTION_NOTE.md](docs/ADOPTION_NOTE.md)       # University adoption & resistance mitigation plan
│   ├── [decisions/](docs/decisions/)                   # Architecture Decision Records (ADRs)
│   │   ├── [0001-modular-monolith-fastapi-react.md](docs/decisions/0001-modular-monolith-fastapi-react.md)
│   │   ├── [0002-hand-built-deterministic-agents-vs-frameworks.md](docs/decisions/0002-hand-built-deterministic-agents-vs-frameworks.md)
│   │   ├── [0003-hybrid-offline-voice-sms-fallback.md](docs/decisions/0003-hybrid-offline-voice-sms-fallback.md)
│   │   └── [0004-sqlite-zero-external-dependency-to-postgres-roadmap.md](docs/decisions/0004-sqlite-zero-external-dependency-to-postgres-roadmap.md)
│   ├── [runbooks/](docs/runbooks/)                     # Operational Runbooks
│   │   ├── [backups.md](docs/runbooks/backups.md)      # Database snapshot & disaster recovery
│   │   ├── [deploy.md](docs/runbooks/deploy.md)        # Production zero-downtime deployment
│   │   ├── [rollback.md](docs/runbooks/rollback.md)    # Immediate release rollback procedure
│   │   ├── [incident.md](docs/runbooks/incident.md)    # SEV-1 incident triage & post-mortem template
│   │   └── [wasmer-deploy.md](docs/runbooks/wasmer-deploy.md) # Wasmer Edge WebAssembly hosting guide
│   └── [security/](docs/security/)                     # Security Specifications
│       └── [threat-model.md](docs/security/threat-model.md) # OWASP Top 10 threat model & mitigations
│
├── [AGENTS.md](AGENTS.md)                       # Project Memory, Conventions & Rules
├── [docker-compose.yml](docker-compose.yml)     # Full stack container configuration
└── [README.md](README.md)                       # Project Documentation Hub
```

---

## 🛡️ SaaS Hardening Compliance (15-Layer Playbook)

This codebase conforms to the **Vibe Coding a Real SaaS: 15-Layer Playbook**:

1. **System Design (Layer 1):** Explicit tenancy boundaries, out-of-scope boundaries, and capacity back-of-the-envelope calculations for 5,000 students ([`docs/system-design.md`](docs/system-design.md)).
2. **System Architecture (Layer 2):** Modular Monolith with formal Architecture Decision Records in [`docs/decisions/`](docs/decisions/).
3. **Databases & Storage (Layer 3):** SQLite zero-dependency default, PostgreSQL production roadmap, automated online atomic backup script with `PRAGMA integrity_check` validation ([`docs/runbooks/backups.md`](docs/runbooks/backups.md)).
4. **Auth & Permissions (Layer 4):** Strict server-side RBAC with centralized `can(user, action, resource)` checking; cross-student resource queries return HTTP 404 to eliminate IDOR ([`docs/permissions.md`](docs/permissions.md)).
5. **APIs & Backend Logic (Layer 5):** Unified JSON error envelopes with unique request tracing IDs across all 4xx/5xx responses ([`docs/api-conventions.md`](docs/api-conventions.md)).
6. **Frontend Experience (Layer 6):** 4 data states (Loading, Empty, Error, Success) on all views, zero client-side secret leaks, and full 2G/3G degradation support.
7. **CI/CD & Git Hygiene (Layer 7):** Automated GitHub Actions pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) and emergency rollback runbook ([`docs/runbooks/rollback.md`](docs/runbooks/rollback.md)).
8. **Testing Strategy (Layer 8):** 12 automated unit and integration tests passing in <2 seconds ([`docs/testing.md`](docs/testing.md)).
9. **Hosting & Cloud (Layer 9):** Infrastructure cost model ($29–$44/mo for 5,000 students) and zero-downtime deployment guide ([`docs/hosting.md`](docs/hosting.md)).
10. **Security & Threat Model (Layer 10):** OWASP Top 10 mitigations, strict CSP and HTTP security headers, and automated log redaction of sensitive credentials ([`docs/security/threat-model.md`](docs/security/threat-model.md)).
11. **Rate Limiting (Layer 11):** Sliding-window rate limiter protecting authentication endpoints, returning HTTP 429 with `Retry-After` headers.
12. **Caching & CDN (Layer 12):** Explicit `Cache-Control` header policies preventing authenticated student data leaks on shared caches ([`docs/caching.md`](docs/caching.md)).
13. **Error Tracking & Logs (Layer 13):** Structured JSON logging with `X-Request-ID` propagation across all layers.
14. **Monitoring & Alerts (Layer 14):** Component-level readiness check at `/api/health` and liveness probe at `/api/health/live` ([`docs/monitoring.md`](docs/monitoring.md)).
15. **Pre-Launch Audit (Appendix B):** 16/16 verification criteria fulfilled and documented in [`docs/PRE_LAUNCH_CHECKLIST.md`](docs/PRE_LAUNCH_CHECKLIST.md).

---

## 📜 Deliverables Checklist (Section 14)
- [x] At least three distinct workflows working end-to-end (Complaints, Gate Pass, Notices, Certificates).
- [x] Admin dashboard with pending/ageing/resolution-time/recurring-issue views.
- [x] Notice targeting + read-receipt tracking with auto-reminder and SMS fallback.
- [x] Low-bandwidth mode + SMS-command fallback demonstrated.
- [x] Every agent hand-built Python (no frameworks), with PatternMemoryAgent specifically deterministic.
- [x] Mobile screens reuse reference design language (`#8B2072`, underline inputs, card accents).
- [x] Desktop layout reuses brand tokens in its own wide-viewport layout (sidebar, multi-column grids).
- [x] Voice agent present on every page, multilingual in English, Hindi, and Odia.
- [x] 3D Campus Quest navigation working with Three.js, degrading gracefully in low-bandwidth mode.
- [x] X-Ray admin view showing live complaint beacons sourced from the real `Complaint` table.
- [x] Hologram mode (Pepper's ghost) and WebAR present with realistic physical requirements.
- [x] Ask Campus intent box creates real `GatePass`, `Complaint`, and briefing data with live approval checklists.
- [x] `docs/ADOPTION_NOTE.md` and `docs/DEMO_SCRIPT.md` written.
- [x] `docker-compose up` runs the full stack with one command.
