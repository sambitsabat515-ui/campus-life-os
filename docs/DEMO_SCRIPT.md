# Campus Life OS — Comprehensive Hackathon Demo Script
**BPUT Hackathon 2026 • Problem Statement 07 Evaluation Walkthrough**

---

## 0. Hackathon Narrative & Persona Matrix
This script is organized to demonstrate the verbatim intent of Problem Statement 07:
> *"Four apps, six notice boards, two WhatsApp groups and one register. Replace all of it."*

### Demo Personas & Pre-Seeded Credentials:
| Role | Name | Email | Password | Primary Mission |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Aarav Sharma | `student@campus.edu` | `student123` | Leaking tap for 9 days, gate pass, bonafide cert, attendance |
| **Warden / Faculty** | Dr. K. C. Pradhan | `warden@campus.edu` | `warden123` | Ticket queue resolution, gate pass endorsement, class attendance |
| **Dean Admin** | Dr. B. K. Mishra | `admin@campus.edu` | `admin123` | Ageing heatmap, recurring issue clustering, targeted notices |
| **Mess Manager** | Ramesh Nayak | `mess@campus.edu` | `mess123` | Publish daily menu, review low-rated food alerts |

---

## 1. Flow A: The Problem Statement Narrative (Menu-Driven Walkthrough)

### Step 1.1: Splash & Onboarding
1. Launch `http://localhost:5173`.
2. Observe the brand **Splash Screen**: Solid `#8B2072` background, centered circular OS badge, and progress bar.
3. Advance through the **Onboarding sequence**:
   - Slide 1: *"One request. No more five queues."*
   - Slide 2: *"Every complaint tracked, end to end."*
   - Slide 3: *"Built for a patchy hostel network."*
4. Click **Get Started** to land on the Login screen.

### Step 1.2: Student Login & Design System
1. On the Login screen, click the **"Student (Aarav Sharma)"** quick-fill button (or enter `student@campus.edu` / `student123`).
2. Point out design tokens matching the specification:
   - Primary buttons in `#8B2072`
   - Underline-style input fields
   - Inline validation and eye toggle
   - Bottom tab bar with 5 icons and active thin underline

### Step 1.3: The "9-Day Leaking Tap" Resolution
1. Tap the **Hostel** tab in the bottom bar.
2. Observe the pre-seeded complaint:
   - **Ticket #1:** *"Leaking bathroom washbasin tap going on for 9 days"*
   - **Ageing Badge:** `>72h` (Critical Overdue, highlighted in red).
   - **Category Card:** Blue left-accent for Plumbing.
3. Tap **Log Issue** and submit a new ticket for Room 302:
   - Title: `Main water valve broken`
   - Description: `Flooding floor tiles non-stop`
4. Notice that **ComplaintRoutingAgent** automatically routes it to the *Hostel Maintenance & Plumbing Cell* with *CRITICAL* priority.

### Step 1.4: Gate Pass & Certificate Approvals (Step Tracker)
1. Tap the **Requests** tab.
2. Select **Gate Passes**: View Aarav's pass to *Cuttack (Home)*:
   - Live step tracker displays: `Faculty Approval [COMPLETED]` $\rightarrow$ `Warden Approval [PENDING]` $\rightarrow$ `Gate Check [PENDING]`.
3. Select **Certificates**:
   - View Bonafide certificate for Passport application in `PROCESSING` status.
   - View Transcript in `READY` status at Counter #2.

### Step 1.5: 75% BPUT Attendance Warning & Schedule
1. Tap the **Schedule** tab.
2. Inspect the overall attendance card:
   - Overall Attendance: **76.7%**
   - **Computer Networks (CS302):** Marked **60.0% (LOW)** with a prominent red shortage alert!
3. Review the weekday day-strip (Mon-Fri) showing lecture halls and instructors.

---

## 2. Flow B: "Ask Campus" Natural Language Intent Coordination (Section 13)
*Proves that a single typed sentence coordinates real database workflows rather than just answering questions.*

1. Tap back to the **Home** tab.
2. Locate the **"Ask Campus"** front door bar.
3. **Test Intent 1 — Temporary Leave:**
   - Click the chip: *"I need to go home to Cuttack tomorrow for my cousin's wedding"*
   - Click **Coordinate**.
   - Result: Automatically creates a real `GatePass` in SQLite.
   - Displays the live institutional approval chain:
     - `Student Submission` [GREEN - Auto-Completed]
     - `Faculty Proctor Approval` [AMBER - Blocked on human]
     - `Warden Endorsement` [AMBER - Blocked on human]
4. **Inspect the Explainability Panel:**
   - Expand *"What the system understood"*.
   - Show judges the raw structured JSON:
     ```json
     {
       "intent": "TEMPORARY_LEAVE",
       "confidence": 0.96,
       "entities": {
         "destination": "Cuttack (Home)",
         "reason": "cousin's wedding"
       },
       "policy_governed": true
     }
     ```
5. **Test Intent 2 — Maintenance with Pattern Memory:**
   - Type: `"There's no water in Room 302"`
   - Click **Coordinate**.
   - Observe: Creates real Complaint and immediately flags:
     > *"System surfaced related complaint history (4 recent tickets in Aryabhatta Hall 302)."*
6. **Test Intent 3 — Daily Briefing:**
   - Click chip: *"Anything important for me today?"*
   - Returns personalized digest tagged `DEADLINE`, `ACTION`, and `STATUS`.

---

## 3. Flow C: Staff / Warden Portal Execution
1. Switch role to **Warden (Dr. K. C. Pradhan)** using the floating role switcher or logout/login.
2. **Resolve the 9-Day Leaking Tap:**
   - In the **Maintenance Queue**, locate Ticket #1.
   - Click **Update Status** $\rightarrow$ change to `RESOLVED` with note: *"Replaced brass valve cartridge. Fully tested."*
   - Submit: Complaint status transitions to RESOLVED with full audit trail!
3. **Approve Gate Pass:**
   - Switch to **Gate Pass Authorizations**.
   - Click **Endorse & Approve** on Aarav's pass.
   - Status updates sequentially!
4. **Mark Class Session Attendance:**
   - Open **Mark Class Attendance** tab.
   - Select `CS302` for today's date, toggle student checkboxes, and click **Commit Session Attendance**.

---

## 4. Flow D: Executive Administrator Console (Section 8)
1. Switch role to **Dean Admin (Dr. B. K. Mishra)**.
2. **Ageing Heatmap & SLA Command:**
   - View live counters: Overdue >72h, 48h-72h, 24h-48h, <24h.
   - Review Average Resolution Time trends by category (Plumbing: 8.5h, Electrical: 4.2h).
3. **Recurring Issue Cluster Merge (Pattern Memory Agent):**
   - Point out the active alert:
     > *"Chronic Plumbing Breakdown: Aryabhatta Hall Room 302 (4 reports in 30d)"*
   - Click **"Merge into Confirmed Incident & Dispatch Team"**.
   - The cluster is merged into an official institutional Incident in SQLite with linked audit records!
4. **Targeted Notice Composer with Read Receipts & SMS Fallback:**
   - Compose a notice targeted to `CSE` branch.
   - Review the **Read Rate meter** on existing notices:
     > *"Read Rate: 50.0% (1/2 acknowledged)"*
   - Click **🔔 Auto-Reminder Unread** $\rightarrow$ queues push reminder.
   - Click **📲 SMS Fallback** $\rightarrow$ dispatches SMS fallback to non-smartphone students!

---

## 5. Flow E: 3D Campus Quest, X-Ray & Hologram Mode (Section 12)
1. Navigate to **3D Campus Quest** (Student or Admin):
2. **Mode 1 — Campus Quest (3D Navigation):**
   - Select destination: *Administrative Block (Bonafide Pickup)*.
   - Three.js draws the purple route curve along paved campus walkways.
   - Animated marker walks along the curve, with the synchronized checklist updating step-by-step.
3. **Mode 2 — X-Ray View (Admin):**
   - Switch to **X-Ray View**.
   - Notice colored glowing beacons on buildings:
     - **Aryabhatta Hall:** Pulsing **RED** beacon due to critical/overdue tickets!
     - **Administrative Block:** **GREEN** beacon (resolved).
   - Click Aryabhatta Hall to inspect the live open tickets directly from the 3D viewport.
4. **Mode 3 — Pepper's Ghost 4-Way Hologram:**
   - Switch to **Hologram (Pyramid)**.
   - Displays 4 inverted 45°-rotated views aligned to a central target square for placing a physical transparency pyramid.
5. **Mode 4 — WebAR:**
   - Switch to **WebAR** demonstrating Google `<model-viewer>` support with documented HTTPS requirements.

---

## 6. Flow F: Accessibility, Offline Multilingual Voice & SMS Fallback
1. **Low-Bandwidth Mode Toggle:**
   - Click the **"⚡ 2G MODE"** toggle in the top bar.
   - Notice immediate suppression of 3D WebGL scenes and heavy animations; Campus Quest seamlessly degrades to a clean text directions checklist.
2. **Offline Multilingual Voice Assistant (Sections 7.4 & 9):**
   - Click the floating mic button.
   - Switch between **English**, **हिंदी**, and **ଓଡ଼ିଆ**.
   - Point out the **Honest Degradation Message**:
     > *"Offline English model ready on localhost."*
     > *(For Odia: honestly informs judges of experimental offline acoustic dictionary).*
   - Click a sample voice prompt (e.g. *"Show my schedule for today"* or *"ଆଜି କ୍ଲାସ କେତେବେଳେ ଅଛି?"*).
   - Agent synthesizes speech and navigates to the target page!
3. **SMS Command Fallback Simulator (Section 10):**
   - Click **SMS Fallback Simulator**.
   - Test commands against `/api/sms-webhook`:
     - `COMPLAINT Tap leaking in 302` $\rightarrow$ Logs ticket in SQLite and returns SLA.
     - `ATTENDANCE` $\rightarrow$ Returns live percentage and shortage warning.
     - `MENU TODAY` $\rightarrow$ Returns breakfast, lunch, dinner menu.
     - `STATUS 1` $\rightarrow$ Returns live resolution status.
   - Switch to **Common Area Kiosk Terminal** tab for students with no phone.
