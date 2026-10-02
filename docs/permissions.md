# Permissions Matrix & Authorization Specification

## 1. Overview
Campus Life OS enforces strict Role-Based Access Control (RBAC) and Object-Level Authorization (IDOR protection). The server is the sole source of truth; frontend gating is strictly for user experience.

## 2. Role Definitions
- **STUDENT**: Regular university enrolled student.
- **STAFF**: Maintenance technician, electrician, plumber, or hostel staff.
- **ADMIN**: Hostel Warden, Chief Warden, Dean of Student Affairs, Campus Administrator.
- **MESS**: Dining hall manager, catering supervisor.
- **GUARD**: Campus security gatekeeper.

## 3. Permissions Matrix (Role × Action)

| Resource | Action | STUDENT | STAFF | ADMIN | MESS | GUARD | Scoping Constraint |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Complaint** | Create | ✅ | ❌ | ✅ | ❌ | ❌ | Owned by creator |
| **Complaint** | View Own | ✅ | ✅ | ✅ | ❌ | ❌ | `user_id == complaint.student_id` |
| **Complaint** | View All / Sector | ❌ | ✅ | ✅ | ❌ | ❌ | Scoped to assigned sector |
| **Complaint** | Update Status / Work Log | ❌ | ✅ | ✅ | ❌ | ❌ | Assigned staff or Admin |
| **Gate Pass** | Request | ✅ | ❌ | ❌ | ❌ | ❌ | Owned by student |
| **Gate Pass** | View Own | ✅ | ❌ | ✅ | ❌ | ✅ | `user_id == pass.student_id` |
| **Gate Pass** | Approve / Reject (Warden) | ❌ | ❌ | ✅ | ❌ | ❌ | Admin / Warden role required |
| **Gate Pass** | Verify QR Scan (Exit/Entry) | ❌ | ❌ | ✅ | ❌ | ✅ | Guard / Admin role required |
| **Notice** | View Targeted | ✅ | ✅ | ✅ | ✅ | ✅ | Filtered by Year/Branch/Hostel |
| **Notice** | Create / Broadcast | ❌ | ❌ | ✅ | ❌ | ❌ | Admin only |
| **Certificate**| Request | ✅ | ❌ | ❌ | ❌ | ❌ | Owned by student |
| **Certificate**| Approve / Issue | ❌ | ❌ | ✅ | ❌ | ❌ | Admin / Dean only |
| **Mess Meal** | View Menu / Today's Diet | ✅ | ✅ | ✅ | ✅ | ❌ | Public / Authenticated |
| **Mess Headcount**| Log Check-in | ✅ | ❌ | ✅ | ✅ | ❌ | Student self-check-in |
| **Mess Ops** | Inventory & Waste Tracker | ❌ | ❌ | ✅ | ✅ | ❌ | Mess Manager & Admin |
| **3D Map** | View Quest & Navigation | ✅ | ✅ | ✅ | ✅ | ✅ | Public / Authenticated |
| **3D X-Ray** | View Complaint Beacons | ❌ | ✅ | ✅ | ❌ | ❌ | Staff & Admin only |

## 4. Central Authorization Function
All resource operations are evaluated through `can(user, action, resource)` defined in `app.auth.security`. Ad-hoc role checks in endpoint bodies are strictly forbidden.
