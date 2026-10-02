# System Design — Campus Life OS (Problem Statement 07)

## 1. Problem Statement
Tier-2 and Tier-3 Indian universities suffer from operational fragmentation across 4 disconnected proprietary apps, 6 physical notice boards, and dozens of physical paper registers. Critical student issues go untracked, hostel gate passes take days of manual paper signatures across warden offices, notices fail to reach affected students, and recurring maintenance failures (e.g. repeated hostel water cooler breakdowns) are never caught before becoming campus-wide crises.

Campus Life OS unifies all university operations into a single offline-resilient, role-based platform designed specifically for the realities of Indian campus environments (cellular dead zones, power fluctuations, and bilingual/regional language needs).

## 2. User Roles & Personas
- **Student**: Submits maintenance complaints, requests two-tier gate passes, tracks status, browses targeted academic notices, completes mess feedback, navigates campus via 3D Campus Quest, queries operations via voice/natural language ("Ask Campus").
- **Staff / Technician**: Receives auto-routed work orders, updates repair statuses, submits work logs, signs off on resolution with SLA tracking.
- **Admin / Warden**: Operates the Central Control Tower, monitors 24h ageing heatmaps and recurring issue clusters, manages multi-level gate pass & certificate approvals, broadcasts targeted notices with delivery analytics, reviews staff workload.
- **Mess Manager**: Tracks real-time meal counts, logs food waste, manages grocery inventory thresholds, views student food satisfaction trends.
- **Campus Security Guard**: Scans departure & entry QR codes at campus gates, verifies warden approvals, and logs timestamps in real time.

## 3. Tenancy & Data Isolation Model
- **Tenancy Architecture**: Single Campus Monolith with departmental & hostel sector scoping (`department_id`, `hostel_block_id`, `batch_year`).
- **Resource Ownership**: Students can strictly access their own gate passes, complaints, and certificates.
- **Role Boundary**: Cross-student resource access is strictly blocked at the API layer with centralized `can(user, action, resource)` checks.

## 4. Core User Workflows
1. **Complaint Lifecycle**:
   Student Voice / Text Submission → AI Auto-Categorization & Priority Routing → Technician Queue → In-Progress Work → Resolution & Student Verification → Pattern Memory Analysis.
2. **Gate Pass Two-Tier Approval**:
   Student Request → Policy Agent Checks (Attendance >75%, No disciplinary holds) → Hostel Warden Digital Approval → Dynamic Security QR Generated → Security Guard Scan at Main Gate.
3. **Targeted Notice Broadcast with SMS Fallback**:
   Admin Composes Notice → Filter by Year/Branch/Hostel → In-App Delivery with Read Receipt Tracking → Automated 4h Unread Reminder → Low-Bandwidth / Offline SMS Fallback.
4. **Certificate Issuance**:
   Student Request (Bonafide/Transcript) → Academic Verification → Digital Counter Clearance → QR Verification.

## 5. Non-Functional Requirements & Compliance
- **Availability**: 99.9% uptime with offline degradation (plain-text fallback when WebGL/3D cannot load).
- **Latency**: P95 < 250ms for all operational read endpoints; P95 < 500ms for agent intent parsing.
- **Data Privacy & Compliance**: Compliance with India's Digital Personal Data Protection (DPDP) Act 2023. Explicit purpose limitation, consent-bound student profiles, and automatic log redaction of student passwords and contact tokens.
- **Bandwidth**: Must operate over 2G/3G connections; 0KB WebGL asset transmission when low-bandwidth mode is active.

## 6. Out-of-Scope Items (Guarding Boundaries)
- Payment Gateway / Fee Collection (deferred to ERP integration via webhooks).
- Full Gradebook / Examination Grading (grades are maintained by external University Examination Portal).
- Custom Hardware Firmware (QR scanners utilize standard mobile phone cameras or USB HID scanners).

## 7. Capacity Back-of-the-Envelope Estimation (Year 1)
- **Active Students**: 5,000 students + 250 faculty/staff.
- **Daily Active Users (DAU)**: ~3,500 users.
- **Peak Requests Per Second (RPS)**:
  - Peak morning gate departures (6 PM - 8 PM) & lunch mess check-ins: ~45 RPS.
  - Notice broadcast blast: ~120 RPS for 30 seconds.
- **Database Storage**:
  - 5,000 students × 5 KB profile = 25 MB.
  - ~15,000 complaints/year × 2 KB = 30 MB.
  - Notices, receipts & logs = 150 MB/year.
  - Total Year 1 DB size: ~205 MB (comfortably handled by SQLite in-memory cache or single-node PostgreSQL).
- **First Bottleneck**:
  - The first operational bottleneck is **concurrent SQLite writes during sudden campus-wide notice read-receipt blasts**. Mitigated by batching read receipts in 5-second in-memory debouncing and roadmap migration to Postgres with connection pooling for 10x scale.
