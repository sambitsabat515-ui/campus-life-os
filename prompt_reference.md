# BUILD PROMPT FOR ANTIGRAVITY — Campus Life OS (BPUT Hackathon 2026, Problem Statement 07)

This supersedes any earlier e-learning-flavored version of this brief. **The product is not an e-learning platform.** It is a campus-operations app — attendance, hostel complaints, gate passes, certificates, mess, notices, administrator visibility — built using the *visual design language* of the reference mobile mockups (the purple onboarding/login/bottom-nav screens), with the *feature set* of BPUT Hackathon 2026 Problem Statement 07, attached as a PDF to this brief and summarized in Section 1.

Paste this into Antigravity as one project brief and work through it section by section — confirm Section 2 (project structure) before moving on.

---

## 1. The actual problem (verbatim intent of Problem Statement 07)

> "Four apps, six notice boards, two WhatsApp groups and one register. Replace all of it."

A student needs a bonafide certificate, wants to report a leaking tap that's been going nine days, wants to know if tomorrow's class is cancelled, and has been told the mess menu changed — and currently that's an entire afternoon spent visiting one office, one warden, one notice board, and one senior who "usually knows." Almost none of that genuinely needed a human being.

**Required outcomes:**
- Routine campus tasks done in one place instead of five queues and a phone call
- Administrators with real visibility into what's pending, where, and for whom
- Faster resolution of complaints/requests/approvals, with an audit trail
- Fewer notices lost to a WhatsApp group at 2 AM
- Works for a student on a low-end phone and a patchy hostel network

**Evaluation weighting** (build in this priority order): friction reduction (30%) → breadth/completeness of workflows (20%) → admin visibility/ageing/recurring-issue tracking (20%) → accessibility/low-bandwidth/no-smartphone fallback (15%) → usability/adoption realism/demo quality (15%).

---

## 2. Non-negotiable constraints

1. **Backend language: Python** (FastAPI).
2. **Database: SQLite3** (SQLAlchemy over a SQLite file — no external DB server for this build).
3. **Separate portals, separate logins:** Student, Staff/Warden, Admin, Mess. Independent route trees and auth, not one dashboard with role-based hiding.
4. **Agents must be hand-built Python** — no LangChain/CrewAI/AutoGen/Semantic Kernel/Haystack. Plain classes, documented contracts (Section 7).
5. **Visual design system reused, feature set replaced.** Take the color palette, typography, onboarding→login flow pattern, card shapes, and bottom-nav pattern from the reference mockups (Section 3) — but every screen's *content* is a campus-ops workflow (attendance, complaints, gate pass, certificates, mess, notices), never a course/grade/CGPA screen.
6. **Responsive, one codebase:** mobile matches Section 3's component language; desktop/Windows Chrome reuses only the color/type/logo tokens in its own wide-viewport layout (sidebar instead of bottom tabs, multi-column grids) — not a stretched phone screen.
7. **Offline-first voice agent** in English, Hindi and Odia, on every page, degrading honestly (not silently) where a language's offline model isn't available. See Section 9.
8. **No hallucinated policy.** Every workflow step a student sees (e.g. gate-pass approval chain) traces to a config row, never to text a model invented.

---

## 3. Visual design system (from the reference mockups — reuse the *language*, not the content)

| Token | Hex | Use |
|---|---|---|
| Primary | `#8B2072` | buttons, active nav, headings, progress dots |
| Neutral-mid | `#949494` | secondary text, secondary button fill |
| Ink | `#000000` | primary text |
| Neutral-light | `#D9D9D9` | dividers, disabled states, subtle fills |

Plus the semantic red/green already implied by form-validation patterns in the reference (red inline error text, green success/confirmation states).

**Reusable patterns from the reference screens** (rebuild these *shapes*, with new content):
- **Splash**: solid primary-color background, centered circular logo mark, app name + one-line subtitle, small copyright footer, thin progress bar at the bottom.
- **Onboarding (2–3 slides)**: white background, top segmented progress bar, centered illustration, bold headline, one-line subtext, filled primary "Next" button, "Skip" as a primary-colored text link — but the headlines now sell *this* product's value ("One request. No more five queues." / "Every complaint tracked, end to end." / "Built for a patchy hostel network.").
- **Login**: "Welcome Back!" title, social-login-style buttons only if relevant (a university SSO button is plausible; Google/Facebook are not, for a college system — use "Log in with University ID" styled the same way), underline-style fields, inline red validation text, eye-icon password toggle, filled primary submit button, forgot-password and sign-up links in the same positions.
- **Create account**: back chevron, centered colored title, underline fields with the same inline validation pattern, filled primary "Continue" button.
- **Main screens**: bottom tab bar with 5 icons, active tab in primary color with a thin underline; a top bar with a page title and a bell/notification icon; card-based lists with colored left-accent or colored fill per category, exactly like the reference's class-schedule color coding — reuse that *exact* device for ticket priority / complaint category instead of subject color.

**Bottom tab bar — redefined for this product** (same visual pattern as the reference, new destinations):
`Home` · `Requests` (gate pass + certificates) · `Schedule` (timetable + attendance) · `Hostel` (complaints + mess) · `Profile`

---

## 4. Project structure

```
campus-life-os/
  backend/
    app/
      main.py
      config.py
      db/{models.py, session.py, seed.py}
      auth/{routes.py, security.py}
      agents/
        base.py
        complaint_routing_agent.py      # Section 7.1
        pattern_memory_agent.py         # Section 7.2 — recurring issue detection
        faq_chatbot_agent.py            # Section 7.3 — "20 questions the office is asked daily"
        voice_intent_agent.py           # Section 7.4
        intent_agent.py                 # Section 13 — Ask Campus
        policy_agent.py                 # Section 13 — reads GatePass.approver_chain config, never invents it
      api/
        routes_student.py    # requests, complaints, schedule, attendance, notices, mess, profile
        routes_staff.py      # ticket queue, attendance marking, mess menu management
        routes_admin.py      # dashboard, ageing, recurring issues, workload, notice composer
        routes_mess.py       # menu, feedback, meal attendance
        routes_voice.py
        routes_sms.py        # SMS-command fallback (Section 10)
        routes_map.py        # admin .glb upload + pin placement, student landmark/route lookup (Section 12)
        routes_ask.py        # Ask Campus intent submission + history (Section 13)
      schemas.py
      tests/
        test_complaint_routing_agent.py
        test_pattern_memory_agent.py
        test_e2e_complaint_to_admin_flow.py
        test_e2e_gatepass_approval_flow.py
        test_e2e_notice_targeting.py
    requirements.txt
    README.md
  frontend/
    src/
      design-tokens.*
      mobile/{onboarding, auth, home, requests, schedule, hostel, profile}/
      desktop/
      staff/
      admin/
      mess/
      voice/
      map/            # Campus Quest (student) + X-Ray/hologram (admin), Section 12
      ask/            # Ask Campus intent box + result/explainability panel, Section 13
      lib/api.*
  docs/{ARCHITECTURE.md, DEMO_SCRIPT.md, ADOPTION_NOTE.md}
  docker-compose.yml
```

---

## 5. The four portals

### 5.1 Student
- **Home** — today's timetable snippet, targeted notices feed, quick actions (raise complaint, request gate pass, request certificate).
- **Requests** — certificate requests (bonafide, transcript, migration) and gate-pass requests, each with a visible step tracker (requested → approved → ready), reusing the reference's card language.
- **Schedule** — timetable, same visual pattern as the reference Schedule screen (day strip + time/course rows), plus an attendance summary (overall % + per-subject %, flagged when under the minimum threshold).
- **Hostel** — complaint/maintenance ticketing (raise a complaint, see its status + audit trail) and mess menu/feedback.
- **Profile** — name, roll number/ID, hostel/room, attendance %, pending-requests count, settings — reusing the reference Profile screen's stat-tile and dashboard-list pattern, with academic stats (CGPA/credits) swapped for operational stats (attendance %, open complaints, pending requests).

### 5.2 Staff / Warden
- Separate login.
- **Ticket queue** — complaints assigned to them, with status updates and resolution notes/photo proof.
- **Attendance** — mark attendance per class session; feeds the student's Schedule-screen attendance %.
- **Mess menu management** (if staff role includes mess committee) — publish the week's menu, see feedback.

### 5.3 Admin
- Separate login.
- **Dashboard** — pending items by category, ageing buckets (>24h/>48h/>72h), recurring-issue alerts ("Room 302 has had 4 plumbing complaints this month"), resolution-time trend, staff workload distribution.
- **Notice composer** — targeted by batch/branch/hostel/year, with delivery and read-receipt tracking, auto-reminder for unread after a configurable window, SMS fallback for unread after that.
- User/hostel/room management.

### 5.4 Mess
- Separate login for the mess/hostel-food side.
- Publish the daily/weekly menu per hostel mess (if there's more than one mess hall, treat each as its own "vendor" in the Section 6 schema, browsed with the reference's card-list pattern).
- See aggregated student feedback/ratings per meal, flagged low-rated items.
- (This can optionally extend to a lightweight ordering/meal-attendance flow — e.g. students mark which meals they'll attend, so the mess can plan quantities — but the core ask from the problem statement is menu publishing + feedback, not food delivery; don't over-build a payments/cart system here.)

---

## 6. Database schema (SQLite3)

```python
# User
id, name, email, password_hash, role (STUDENT|STAFF|ADMIN|MESS),
roll_no, branch, year, hostel, room, phone, preferred_language, created_at

# Complaint
id, student_id, category, title, description, photo_path,
place (hostel/block), room, floor, priority, status (OPEN|ASSIGNED|IN_PROGRESS|RESOLVED),
assigned_to, created_at, resolved_at

# ComplaintAuditTrail
id, complaint_id, action, performed_by, previous_status, new_status, note, timestamp

# GatePass
id, student_id, reason, destination, departure_time, expected_return,
approver_chain (JSON — e.g. faculty + warden), status (PENDING|APPROVED|REJECTED|OUT|RETURNED), created_at

# CertificateRequest
id, student_id, type (BONAFIDE|TRANSCRIPT|MIGRATION), purpose,
status (PENDING|PROCESSING|READY|COLLECTED), requested_at, ready_at

# Attendance
id, course_id, student_id, session_date, status (PRESENT|ABSENT), marked_by

# ScheduleSlot
id, course_id, day_of_week, start_time, end_time, room, instructor_name

# Notice
id, title, body, author_id, target_type (ALL|BATCH|BRANCH|HOSTEL|YEAR), target_value,
priority, created_at
# NoticeReadReceipt
id, notice_id, student_id, read_at, acknowledged_at

# MessHall            ("vendor" equivalent — one row per hostel mess/canteen)
id, name, hostel_id

# MessMenuItem
id, mess_hall_id, date, meal_type (BREAKFAST|LUNCH|SNACKS|DINNER), name, photo_path

# MessFeedback
id, student_id, menu_item_id, rating (1-5), tags (JSON: too_salty/cold/good/...), comment, created_at

# VoiceSession
id, user_id, language (en|hi|or), transcript, response_text, created_at

# CampusMap           (Section 12 — admin-uploaded 3D model)
id, glb_path, uploaded_by, uploaded_at, is_active

# MapPin
id, campus_map_id, label, x, y, z   # coordinates within the uploaded model's space

# AskRequest           (Section 13 — Ask Campus history/trace)
id, student_id, raw_text, intent, confidence, entities (JSON),
linked_complaint_id (nullable), linked_gatepass_id (nullable), created_at
```

---

## 7. Agent contracts

```python
# backend/app/agents/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

@dataclass
class AgentResult:
    agent_name: str
    output: dict[str, Any]
    confidence: float | None = None
    reasoning: str | None = None

class Agent(ABC):
    name: str
    @abstractmethod
    def run(self, input_data: dict) -> AgentResult: ...
```

### 7.1 Complaint Routing Agent
- Input: `{ category_text, free_text }` → keyword/rule-based category classification (Plumbing/Electrical/Mess/Cleanliness/IT/Other) + priority estimate, then a department/owner lookup from a **routing config table**, never invented. Output includes `department`, `owner_role`, `suggested_priority`.

### 7.2 Pattern/Memory Agent (recurring issue detection)
- Deterministic (not LLM-based, per the brief's own instruction): query complaints by same place + category within a configurable time window (default 2 hours for "is this breaking right now," plus a separate 30-day view for "is this a chronic problem"). Returns related-complaint clusters; exposes an admin action to merge a cluster into a confirmed `Incident`.

### 7.3 FAQ Chatbot Agent ("the twenty questions the office is asked every day")
- A small fixed set of rule-matched Q&A pairs (library hours, how to get a bonafide certificate, gate-pass process, today's mess menu, attendance threshold) answered instantly and deterministically, falling back to "I can't answer that — here's where to raise it as a request" rather than guessing. This is the lowest-risk, most direct hit on the "optional intelligence" line in the brief.

### 7.4 Voice Intent Agent
- Transcribed text + page context + language → one of a small fixed intent set (`READ_SCHEDULE`, `READ_ATTENDANCE`, `RAISE_COMPLAINT`, `CHECK_MESS_MENU`, `NAVIGATE_TO`, `ASK_FAQ`, `UNKNOWN`) → calls the matching existing API or hands off to the FAQ Chatbot Agent. Same contract style as the other agents.

---

## 8. Admin dashboard specifics (this is 20% of the grade — do not under-build it)

- Pending-items counter by category and by hostel
- Ageing heatmap: complaints older than 24h/48h/72h flagged with increasing severity
- Resolution-time trend (avg hours to resolve, by category, over time)
- Workload distribution across staff (tickets assigned / staff member)
- Recurring-issue alerts (from the Pattern/Memory Agent)
- Notice read-rate ("Only 40% of CSE 3rd Year read the exam notice")
- Auto-refresh (polling every few seconds is fine for the demo; document WebSockets/SSE as the production upgrade)

---

## 9. Offline multilingual voice agent — realistic plan

Same honest constraint as any offline-voice ask: the browser's built-in Web Speech API needs internet in most browsers. For genuine offline operation:
- **STT:** an on-device engine such as **Vosk** (small multilingual models; Hindi is reasonably supported, Odia support is limited/experimental — document this gap explicitly rather than silently degrading).
- **TTS:** an on-device engine such as **Piper**, not a cloud TTS API.
- Runs as a local service the frontend calls over `localhost`, so "offline" means no external network call — the backend is local, which is what makes it achievable.
- Floating mic button on every screen (student/staff/admin/mess), language switcher (EN/HI/OR) persisted per user, visible transcript + response panel, and an honest in-UI message if a language's offline model isn't available in that environment.

---

## 10. Accessibility (15% of the grade)

- **Low-bandwidth mode**: a toggle that disables heavy imagery/animation; keep the core flows (complaint, gate pass, schedule, notices) usable on a 2G/3G connection and a low-end Android.
- **No-smartphone fallback**: an SMS-command endpoint (`POST /api/sms-webhook`) parsing a few fixed formats — `COMPLAINT <text>`, `ATTENDANCE`, `MENU TODAY`, `STATUS <id>` — into the same backend pipeline the app uses, so the SMS path and the app path share one brain. Document a kiosk-mode fallback (a shared tablet/terminal in a common area) for students with no phone at all.
- **Regional language**: UI strings externalized (EN/HI/OR JSON packs), not hardcoded — this also feeds the voice agent's language switcher.

---

## 11. Adoption note (required deliverable per the brief)

Write `docs/ADOPTION_NOTE.md` covering: what data a college needs to provide (student roster, hostel/room list, staff/department mapping, existing timetable) and how it's imported (a CSV upload + column-mapping wizard, duplicate detection); a phased rollout (one hostel first, then one department's notices replacing WhatsApp, then campus-wide); and the explicit point that this sits **on top of** existing systems rather than replacing them outright — the biometric attendance system, for instance, is read via an adapter, not torn out.

---

## 12. 3D campus map, X-Ray view and hologram mode (demo-quality wow-factor — 15% of the grade)

A working reference implementation of everything in this section already exists (Three.js + an uploaded campus `.glb` model) — port the *behavior*, rebuild the visuals to match this brief's design system (Section 3), not the other way round.

### 12.1 Campus Quest — 3D navigation (student-facing)
- Load the campus `.glb` model (admin-uploadable, Section 12.4) into a Three.js scene with orbit controls.
- A small set of named landmarks (gate, hostels, academic block, admin block, mess) are pinned to real coordinates on the model.
- Given a destination (e.g. "Administrative Block" for a certificate pickup, or a gate-pass departure point), draw a route line between landmarks and animate a marker walking it, with a step-by-step checklist ("Exit through Main Gate → Pass the Library → Arrive") synced to the marker's progress — this directly replaces "which office, which building" friction from the problem statement's own example story.
- Must degrade gracefully: in low-bandwidth mode, replace the 3D view with a plain text list of landmarks and directions — never a blank screen.

### 12.2 X-Ray view (admin-facing)
- The same 3D campus model, now showing colored beacons on each building: red = critical/overdue complaint present, amber = pending, green = all resolved, sized/pulsing by severity.
- Clicking a beacon shows the open tickets at that location (reuses the Complaint data from Section 6 — no separate data model).
- This is the dashboard's "where" answer, visually, on top of the numeric ageing/workload views from Section 8.

### 12.3 Hologram mode ("Pepper's ghost" demo device)
- A toggle on the X-Ray page that renders four mirrored 45°-rotated views of the same 3D scene, tiled so the page can be placed under a simple plastic pyramid (cut from a transparency sheet) for a physical holographic-looking demo at judging. This is a presentation trick layered on the same renderer/scene from 12.2, not separate data or logic.

### 12.4 WebAR + admin map upload
- Admin can upload a `.glb` of the real campus (or use the bundled placeholder/demo model if none is uploaded yet — label it clearly as a placeholder in that case) and drop named location pins by clicking on a 2D preview of it; those pins become the landmarks used in 12.1 and 12.2.
- A `<model-viewer>` instance (Google's web component) provides phone-based WebAR (`ar-modes="webxr scene-viewer quick-look"`) as an alternative to the orbit-control Three.js view — this needs HTTPS and a phone with ARCore/ARKit; document that requirement plainly rather than promising it works everywhere.

## 13. Ask Campus — intent-first layer (optional intelligence, done properly)

The brief's "optional intelligence" line allows for "a chatbot that answers the twenty questions the office is asked every day" (Section 7.3 covers that) — go one step further and let a single typed sentence *create and coordinate* a workflow, not just answer a question. A working reference implementation of this already exists; port its behavior into this build rather than treating it as a separate product.

- **Entry point:** on the student Home screen (or its own nav item), a single free-text box — "Tell the campus what you need" — instead of (or in addition to) menu navigation. Natural-language intent is the front door; the structured Requests/Hostel/Schedule screens from Sections 3 and 5 remain available and are *driven by the same backend data*, not a separate parallel system.
- **Intent Agent** (hand-built, same contract style as Section 7): classifies free text into a small fixed set — `TEMPORARY_LEAVE`, `MAINTENANCE_COMPLAINT`, `CERTIFICATE_REQUEST`, `BRIEFING_REQUEST`, `UNKNOWN` — with extracted entities (date, reason, room number) and a confidence score. Below a confidence threshold, or with missing required entities, the system asks a clarifying question rather than guessing.
- **Policy Agent + Workflow Planner:** a leave/gate-pass intent pulls its required approval chain from the same `GatePass.approver_chain` config as Section 6 — never invented — and shows the student a live checklist (leave request created → faculty approval → warden approval → gate authorization → done), with GREEN steps completing automatically and AMBER steps genuinely blocked until a human approves them via the Staff/Admin portal (same enforcement rule as Section 2, item 8).
- **Memory/Pattern Engine reuse:** a maintenance-complaint intent runs through the same Section 7.2 Pattern Agent, so "there's no water in Room 312" can immediately surface "3 related complaints in this block in the last 2 hours" to the admin, exactly as in the non-intent complaint flow — this is one engine serving two entry points, not two engines.
- **Briefing intent:** "anything important for me today?" returns a short, personalized list (pulled from Notices + the student's own pending requests) tagged `INFO`/`ACTION`/`DEADLINE`/`STATUS` — not a dump of every campus announcement.
- **Explainability:** every response includes a collapsible "what the system understood" panel showing the Intent Agent's raw structured output, so a judge (or a confused student) can see the classification wasn't magic.

## 14. Deliverables checklist

- [ ] At least three distinct workflows working end to end, student request → admin resolution (complaint ticketing, gate pass, notices are the natural three; certificate request is a strong fourth)
- [ ] Admin dashboard with pending/ageing/resolution-time/recurring-issue views, built per Section 8
- [ ] Notice targeting + read-receipt tracking, with auto-reminder and SMS fallback for unread
- [ ] Low-bandwidth mode + SMS-command fallback demonstrated, per Section 10
- [ ] Every agent in Section 7 hand-built (no agent frameworks), with the Pattern/Memory Agent specifically deterministic, not LLM-based
- [ ] Mobile screens reuse the reference design language (Section 3) with campus-ops content, never course/grade content
- [ ] Desktop layout shares only the brand tokens, not the mobile composition
- [ ] Voice agent present on every page, functional offline in English at minimum, Hindi/Odia gap documented honestly if the chosen engine can't fully cover it
- [ ] 3D Campus Quest navigation working from the uploaded/placeholder `.glb`, degrading to a text directions list in low-bandwidth mode
- [ ] X-Ray admin view showing live complaint beacons sourced from the same `Complaint` table as the rest of the app (no separate data model)
- [ ] Hologram mode and WebAR present, clearly labeled with their real-world requirements (a physical pyramid; an AR-capable phone over HTTPS) rather than oversold
- [ ] Ask Campus intent box creates real `GatePass`/`Complaint`/notice-briefing data — not a parallel demo dataset — and every AMBER approval step is genuinely blocked until a human approves it
- [ ] `docs/ADOPTION_NOTE.md` and `docs/DEMO_SCRIPT.md` written, with the demo script walking through both the menu-driven flows and the Ask Campus intent flow for the same underlying data
- [ ] `docker-compose up` runs the whole stack with one command
