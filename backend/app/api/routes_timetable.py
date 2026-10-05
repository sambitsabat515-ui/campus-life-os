"""
routes_timetable.py — Timetable CRUD for staff to manage class schedule slots.
Staff can create, update, delete, and view schedule slots by batch/branch/day.
"""
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import ScheduleSlot, User
from app.auth.security import require_role

router = APIRouter(prefix="/api/timetable", tags=["Timetable"])


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class SlotCreate(BaseModel):
    course_id: str
    course_name: str
    day_of_week: str          # Monday … Sunday
    start_time: str           # HH:MM
    end_time: str             # HH:MM
    room: str
    instructor_name: str
    batch: str = "CSE-2023"


class SlotUpdate(BaseModel):
    course_name: Optional[str] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room: Optional[str] = None
    instructor_name: Optional[str] = None
    batch: Optional[str] = None


class SlotResponse(BaseModel):
    id: int
    course_id: str
    course_name: str
    day_of_week: str
    start_time: str
    end_time: str
    room: str
    instructor_name: str
    batch: str

    class Config:
        from_attributes = True


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/slots", response_model=List[SlotResponse])
def get_all_slots(
    batch: Optional[str] = None,
    day: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Public endpoint — students & staff can view timetable.
    Optional filters: ?batch=CSE-2023  ?day=Monday
    """
    q = db.query(ScheduleSlot)
    if batch:
        q = q.filter(ScheduleSlot.batch == batch)
    if day:
        q = q.filter(ScheduleSlot.day_of_week == day)
    return q.order_by(ScheduleSlot.day_of_week, ScheduleSlot.start_time).all()


@router.post("/slots", response_model=SlotResponse)
def create_slot(
    data: SlotCreate,
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Staff/Admin create a new timetable slot."""
    # Conflict check: same batch + day + overlapping time
    existing = db.query(ScheduleSlot).filter(
        ScheduleSlot.batch == data.batch,
        ScheduleSlot.day_of_week == data.day_of_week,
        ScheduleSlot.room == data.room,
        ScheduleSlot.start_time == data.start_time
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Room {data.room} already has {existing.course_id} at {data.start_time} on {data.day_of_week}"
        )

    slot = ScheduleSlot(
        course_id=data.course_id.upper(),
        course_name=data.course_name,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
        room=data.room,
        instructor_name=data.instructor_name,
        batch=data.batch
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.put("/slots/{slot_id}", response_model=SlotResponse)
def update_slot(
    slot_id: int,
    data: SlotUpdate,
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Staff/Admin update an existing timetable slot."""
    slot = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if data.course_name is not None:
        slot.course_name = data.course_name
    if data.day_of_week is not None:
        slot.day_of_week = data.day_of_week
    if data.start_time is not None:
        slot.start_time = data.start_time
    if data.end_time is not None:
        slot.end_time = data.end_time
    if data.room is not None:
        slot.room = data.room
    if data.instructor_name is not None:
        slot.instructor_name = data.instructor_name
    if data.batch is not None:
        slot.batch = data.batch

    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/slots/{slot_id}")
def delete_slot(
    slot_id: int,
    staff: User = Depends(require_role("STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Staff/Admin delete a timetable slot."""
    slot = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    db.delete(slot)
    db.commit()
    return {"status": "deleted", "slot_id": slot_id}


@router.get("/staff-workload")
def get_staff_workload(
    db: Session = Depends(get_db)
):
    """
    Returns per-instructor teaching hours per day (from ScheduleSlots).
    Used by Admin to detect overload and reassign.
    """
    slots = db.query(ScheduleSlot).all()
    workload: dict = {}  # instructor_name -> {day -> hours, total_hours}

    for s in slots:
        name = s.instructor_name
        if name not in workload:
            workload[name] = {"instructor": name, "days": {}, "total_slots": 0, "slots": []}

        day = s.day_of_week
        workload[name]["days"][day] = workload[name]["days"].get(day, 0) + 1
        workload[name]["total_slots"] += 1
        workload[name]["slots"].append({
            "id": s.id,
            "course_id": s.course_id,
            "course_name": s.course_name,
            "day": day,
            "start": s.start_time,
            "end": s.end_time,
            "room": s.room,
            "batch": s.batch
        })

    result = list(workload.values())
    # Sort by total_slots desc to surface overloaded staff first
    result.sort(key=lambda x: x["total_slots"], reverse=True)
    return result


@router.put("/slots/{slot_id}/reassign")
def reassign_slot(
    slot_id: int,
    body: dict,
    admin: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Admin reassigns a slot to a different instructor."""
    slot = db.query(ScheduleSlot).filter(ScheduleSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    new_instructor = body.get("instructor_name")
    if not new_instructor:
        raise HTTPException(status_code=400, detail="instructor_name required")
    slot.instructor_name = new_instructor
    db.commit()
    return {"status": "reassigned", "slot_id": slot_id, "new_instructor": new_instructor, "instructor_name": new_instructor}
