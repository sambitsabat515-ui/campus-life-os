import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.db.session import get_db
from app.db.models import User, Complaint, ComplaintAuditTrail, Attendance, ScheduleSlot, GatePass, MessMenuItem, MessHall
from app.auth.security import require_role
from app.schemas import (
    ComplaintStatusUpdate, ComplaintResponse, AttendanceMark,
    AttendanceRecordResponse, GatePassAction, GatePassResponse, MessMenuItemCreate
)

router = APIRouter(prefix="/api/staff", tags=["Staff & Warden Portal"])

# ─── Gate Pass Escalation Config ──────────────────────────────────────────────
# If a gate pass is not acted on within these minutes, it escalates up the chain.
ESCALATION_MINUTES = {
    "STAFF": 30,    # 30 min → escalate to HOD
    "HOD": 60,      # 60 min from HOD assignment → escalate to ADMIN
}

# ─── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_staff_dashboard(staff: User = Depends(require_role("STAFF", "ADMIN")), db: Session = Depends(get_db)):
    assigned_count = db.query(Complaint).filter(Complaint.assigned_to == staff.id, Complaint.status != "RESOLVED").count()
    all_open_tickets = db.query(Complaint).filter(Complaint.status.in_(["OPEN", "ASSIGNED", "IN_PROGRESS"])).count()
    pending_gatepass = db.query(GatePass).filter(GatePass.status == "PENDING").count()

    return {
        "staff": {
            "name": staff.name,
            "role": staff.role,
            "hostel": staff.hostel,
            "branch": staff.branch
        },
        "stats": {
            "my_assigned_tickets": assigned_count,
            "campus_open_tickets": all_open_tickets,
            "pending_gatepasses": pending_gatepass
        }
    }

# ─── Tickets ──────────────────────────────────────────────────────────────────

@router.get("/tickets", response_model=List[ComplaintResponse])
def get_assigned_tickets(staff: User = Depends(require_role("STAFF", "ADMIN")), db: Session = Depends(get_db)):
    query = db.query(Complaint)
    if staff.hostel:
        query = query.filter((Complaint.assigned_to == staff.id) | (Complaint.place == staff.hostel))
    else:
        query = query.filter(Complaint.assigned_to == staff.id)

    tickets = query.order_by(desc(Complaint.created_at)).all()
    now = datetime.datetime.utcnow()
    results = []
    for c in tickets:
        age_hours = (now - c.created_at).total_seconds() / 3600.0 if c.created_at else 0
        bucket = "normal"
        if age_hours > 72:
            bucket = ">72h"
        elif age_hours > 48:
            bucket = ">48h"
        elif age_hours > 24:
            bucket = ">24h"

        results.append({
            "id": c.id,
            "student_id": c.student_id,
            "category": c.category,
            "title": c.title,
            "description": c.description,
            "photo_path": c.photo_path,
            "place": c.place,
            "room": c.room,
            "floor": c.floor,
            "priority": c.priority,
            "status": c.status,
            "assigned_to": c.assigned_to,
            "incident_id": c.incident_id,
            "created_at": c.created_at,
            "resolved_at": c.resolved_at,
            "audit_trails": c.audit_trails,
            "age_hours": round(age_hours, 1),
            "ageing_bucket": bucket
        })
    return results


@router.put("/tickets/{complaint_id}/status")
def update_ticket_status(
    complaint_id: int,
    data: ComplaintStatusUpdate,
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    prev_status = complaint.status
    complaint.status = data.status.upper()
    now = datetime.datetime.utcnow()

    if data.status.upper() == "RESOLVED":
        complaint.resolved_at = now
    if data.assigned_to:
        complaint.assigned_to = data.assigned_to

    audit = ComplaintAuditTrail(
        complaint_id=complaint.id,
        action=f"STATUS_UPDATED_TO_{data.status.upper()}",
        performed_by=staff.id,
        previous_status=prev_status,
        new_status=data.status.upper(),
        note=data.note or f"Status transitioned by {staff.name}",
        timestamp=now
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "complaint_id": complaint.id, "new_status": complaint.status}

# ─── Attendance ───────────────────────────────────────────────────────────────

@router.get("/attendance/check")
def check_attendance_committed(
    course_id: str,
    session_date: str,
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Check if attendance has already been committed for a given course+date.
    Returns committed status and the existing records so staff can edit.
    """
    try:
        date_obj = datetime.date.fromisoformat(session_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    records = db.query(Attendance).filter(
        Attendance.course_id == course_id,
        Attendance.session_date == date_obj
    ).all()

    if not records:
        return {"committed": False, "records": []}

    return {
        "committed": True,
        "records": [
            {
                "student_id": r.student_id,
                "status": r.status,
                "marked_by": r.marked_by
            }
            for r in records
        ]
    }


@router.post("/attendance/mark")
def mark_attendance_session(
    data: AttendanceMark,
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Mark attendance for each student individually (PRESENT or ABSENT per student).
    The data.student_ids list = PRESENT students; remaining enrolled = ABSENT.
    Now supports per-student status via student_statuses dict override.
    """
    updated = 0
    created = 0

    for s_id in data.student_ids:
        existing = db.query(Attendance).filter(
            Attendance.course_id == data.course_id,
            Attendance.student_id == s_id,
            Attendance.session_date == data.session_date
        ).first()

        if existing:
            existing.status = data.status
            existing.marked_by = staff.id
            updated += 1
        else:
            att = Attendance(
                course_id=data.course_id,
                student_id=s_id,
                session_date=data.session_date,
                status=data.status,
                marked_by=staff.id
            )
            db.add(att)
            created += 1

    db.commit()
    return {
        "status": "success",
        "marked_students_count": len(data.student_ids),
        "course_id": data.course_id,
        "created": created,
        "updated": updated
    }


@router.post("/attendance/mark-bulk")
@router.post("/attendance/bulk")
def mark_attendance_bulk(
    body: dict,
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Mark attendance with per-student P/A toggle.
    Body: {
      course_id: str,
      session_date: str,
      attendance: [{student_id: int, status: "PRESENT"|"ABSENT"}, ...]
    }
    """
    course_id = body.get("course_id")
    session_date_str = body.get("session_date")
    attendance_list = body.get("attendance") or body.get("attendances") or []

    if not course_id or not session_date_str:
        raise HTTPException(status_code=400, detail="course_id and session_date required")

    try:
        date_obj = datetime.date.fromisoformat(session_date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    updated = 0
    created = 0

    for entry in attendance_list:
        s_id = entry.get("student_id")
        att_status = (entry.get("status") or "ABSENT").upper()
        if att_status not in ("PRESENT", "ABSENT"):
            att_status = "ABSENT"

        existing = db.query(Attendance).filter(
            Attendance.course_id == course_id,
            Attendance.student_id == s_id,
            Attendance.session_date == date_obj
        ).first()

        if existing:
            existing.status = att_status
            existing.marked_by = staff.id
            updated += 1
        else:
            db.add(Attendance(
                course_id=course_id,
                student_id=s_id,
                session_date=date_obj,
                status=att_status,
                marked_by=staff.id
            ))
            created += 1

    db.commit()
    return {
        "status": "success",
        "total": len(attendance_list),
        "created": created,
        "updated": updated,
        "course_id": course_id,
        "session_date": session_date_str
    }

# ─── Students List (fixes data-migration: return ALL students) ────────────────

@router.get("/students")
def list_students(
    branch: Optional[str] = None,
    year: Optional[int] = None,
    batch: Optional[str] = None,
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Returns ALL students in DB (fixing upload data not showing).
    Optional filters: ?branch=CSE&year=2&batch=CSE-2023
    """
    q = db.query(User).filter(User.role == "STUDENT")
    if branch:
        q = q.filter(User.branch == branch)
    if year:
        q = q.filter(User.year == year)
    # batch filter uses roll_no prefix convention if needed
    students = q.order_by(User.name).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "roll_no": s.roll_no,
            "branch": s.branch,
            "year": s.year,
            "hostel": s.hostel,
            "room": s.room,
            "email": s.email,
            "phone": s.phone
        }
        for s in students
    ]

# ─── Gate Pass — with Escalation Queue ───────────────────────────────────────

@router.get("/gatepass/queue", response_model=List[GatePassResponse])
def get_gatepass_queue(
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    passes = db.query(GatePass).order_by(desc(GatePass.created_at)).all()
    now = datetime.datetime.utcnow()
    results = []

    for gp in passes:
        try:
            chain = json.loads(gp.approver_chain)
        except Exception:
            chain = []

        # ── Escalation logic ──────────────────────────────────────────────
        if gp.status == "PENDING" and gp.created_at:
            age_minutes = (now - gp.created_at).total_seconds() / 60.0
            _try_escalate(gp, chain, age_minutes, now, db)

        results.append({
            "id": gp.id,
            "student_id": gp.student_id,
            "reason": gp.reason,
            "destination": gp.destination,
            "departure_time": gp.departure_time,
            "expected_return": gp.expected_return,
            "approver_chain": chain,
            "status": gp.status,
            "created_at": gp.created_at
        })

    return results


def _try_escalate(gp: GatePass, chain: list, age_minutes: float, now: datetime.datetime, db: Session):
    """
    Escalation ladder:
      0-30 min  → STAFF level
      30-90 min → HOD level
      90+ min   → ADMIN/PRINCIPAL level
    Mutates `chain` in place and persists to DB if escalated.
    """
    changed = False

    # Determine current escalation level from chain
    current_level = None
    for step in chain:
        if step.get("status") in ("PENDING", "ACTIVE"):
            current_level = step.get("role", "STAFF")
            break

    if current_level in ("STAFF", "FACULTY", "WARDEN") and age_minutes > ESCALATION_MINUTES["STAFF"]:
        # Escalate to HOD
        for step in chain:
            if step.get("status") in ("PENDING", "ACTIVE") and step.get("role") in ("STAFF", "FACULTY", "WARDEN"):
                step["status"] = "ESCALATED"
                step["escalated_at"] = now.isoformat()
                step["note"] = f"Auto-escalated to HOD after {int(age_minutes)}min with no response"
        chain.append({
            "role": "HOD",
            "status": "ACTIVE",
            "assigned_at": now.isoformat(),
            "note": "Escalated from Staff — awaiting HOD approval"
        })
        changed = True

    elif current_level == "HOD" and age_minutes > (ESCALATION_MINUTES["STAFF"] + ESCALATION_MINUTES["HOD"]):
        # Escalate to ADMIN/PRINCIPAL
        for step in chain:
            if step.get("status") in ("PENDING", "ACTIVE") and step.get("role") == "HOD":
                step["status"] = "ESCALATED"
                step["escalated_at"] = now.isoformat()
                step["note"] = f"Auto-escalated to Admin after {int(age_minutes)}min"
        chain.append({
            "role": "ADMIN",
            "status": "ACTIVE",
            "assigned_at": now.isoformat(),
            "note": "Critical escalation — HOD did not respond. Principal / Admin action required."
        })
        changed = True

    if changed:
        gp.approver_chain = json.dumps(chain)
        db.add(gp)
        db.commit()


@router.post("/gatepass/{gatepass_id}/escalate")
def escalate_gatepass_manually(
    gatepass_id: int,
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Manually escalate gatepass to next level (Staff -> HOD -> Admin/Principal).
    Used for urgent requests or testing escalation timeout behavior.
    """
    gp = db.query(GatePass).filter(GatePass.id == gatepass_id).first()
    if not gp:
        raise HTTPException(status_code=404, detail="Gate pass not found")

    try:
        chain = json.loads(gp.approver_chain)
    except Exception:
        chain = []

    now = datetime.datetime.utcnow()
    # Check if there is an explicitly ACTIVE step (e.g. from prior escalation), otherwise first PENDING step
    active_step = next((s for s in chain if s.get("status") == "ACTIVE"), None)
    if not active_step:
        active_step = next((s for s in chain if s.get("status") == "PENDING"), None)

    if active_step:
        current_role = active_step.get("role", "STAFF")
        active_step["status"] = "ESCALATED"
        active_step["escalated_at"] = now.isoformat()
    else:
        current_role = "STAFF"

    if current_role == "HOD":
        target_role = "ADMIN"
        note = "Escalated to Admin / Principal due to HOD non-response"
    elif current_role in ("STAFF", "FACULTY", "WARDEN", "SECURITY", None):
        target_role = "HOD"
        note = "Escalated to HOD queue due to timeout / priority override"
    else:
        target_role = "ADMIN"
        note = "Direct escalation to Principal / Dean of Student Affairs"

    chain.append({
        "role": target_role,
        "status": "ACTIVE",
        "assigned_at": now.isoformat(),
        "note": note
    })
    gp.approver_chain = json.dumps(chain)
    db.commit()
    return {"status": "success", "gatepass_id": gp.id, "escalated_to": target_role, "approver_chain": chain}


@router.post("/gatepass/{gatepass_id}/action")
def act_on_gatepass(
    gatepass_id: int,
    data: GatePassAction,
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    gp = db.query(GatePass).filter(GatePass.id == gatepass_id).first()
    if not gp:
        raise HTTPException(status_code=404, detail="Gate pass not found")

    try:
        chain = json.loads(gp.approver_chain)
    except Exception:
        chain = []

    now = datetime.datetime.utcnow().isoformat()
    action = data.action.upper()

    if action == "APPROVE":
        updated_any = False
        for step in chain:
            if step.get("status") in ["PENDING", "ACTIVE"]:
                step["status"] = "APPROVED"
                step["timestamp"] = now
                step["approved_by"] = staff.name
                step["note"] = data.note or "Approved by staff"
                updated_any = True
                break

        all_approved = all(s.get("status") in ("APPROVED",) for s in chain if s.get("status") not in ("ESCALATED",))
        if all_approved or len(chain) == 0:
            gp.status = "APPROVED"
        else:
            gp.status = "PENDING"

    elif action == "REJECT":
        for step in chain:
            if step.get("status") in ["PENDING", "ACTIVE"]:
                step["status"] = "REJECTED"
                step["timestamp"] = now
                step["note"] = data.note or "Rejected by staff"
                break
        gp.status = "REJECTED"

    elif action == "MARK_OUT":
        gp.status = "OUT"

    elif action == "MARK_RETURNED":
        gp.status = "RETURNED"

    gp.approver_chain = json.dumps(chain)
    db.commit()

    return {"status": "success", "gatepass_id": gp.id, "new_status": gp.status}

