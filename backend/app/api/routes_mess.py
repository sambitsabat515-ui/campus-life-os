import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.db.session import get_db
from app.db.models import User, MessHall, MessMenuItem, MessFeedback
from app.auth.security import require_role
from app.schemas import (
    MessMenuItemCreate, MessMenuItemResponse, MessFeedbackCreate,
    MessFeedbackResponse, MessHallResponse
)

router = APIRouter(prefix="/api/mess", tags=["Mess Portal & Dining"])

@router.get("/halls")
def get_mess_halls(db: Session = Depends(get_db)):
    halls = db.query(MessHall).all()
    today = datetime.date.today()
    results = []

    for h in halls:
        today_items = db.query(MessMenuItem).filter(
            MessMenuItem.mess_hall_id == h.id,
            MessMenuItem.date == today
        ).all()

        enriched_items = []
        for it in today_items:
            fbs = db.query(MessFeedback).filter(MessFeedback.menu_item_id == it.id).all()
            avg_rating = round(sum(f.rating for f in fbs) / len(fbs), 1) if fbs else 4.0
            enriched_items.append({
                "id": it.id,
                "mess_hall_id": it.mess_hall_id,
                "date": it.date,
                "meal_type": it.meal_type,
                "name": it.name,
                "photo_path": it.photo_path,
                "average_rating": avg_rating,
                "ratings_count": len(fbs),
                "flagged_low": avg_rating < 3.0,
                "feedbacks": [
                    {
                        "id": f.id,
                        "student_id": f.student_id,
                        "menu_item_id": f.menu_item_id,
                        "rating": f.rating,
                        "tags": json.loads(f.tags) if f.tags else [],
                        "comment": f.comment,
                        "created_at": f.created_at
                    }
                    for f in fbs
                ]
            })

        results.append({
            "id": h.id,
            "name": h.name,
            "hostel_id": h.hostel_id,
            "today_menu": enriched_items
        })
    return results

@router.post("/menu-items", response_model=MessMenuItemResponse)
def add_menu_item(
    data: MessMenuItemCreate,
    mess_user: User = Depends(require_role("MESS", "STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    item = MessMenuItem(
        mess_hall_id=data.mess_hall_id,
        date=data.date,
        meal_type=data.meal_type.upper(),
        name=data.name,
        photo_path=data.photo_path
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id,
        "mess_hall_id": item.mess_hall_id,
        "date": item.date,
        "meal_type": item.meal_type,
        "name": item.name,
        "photo_path": item.photo_path,
        "average_rating": None,
        "ratings_count": 0,
        "flagged_low": False,
        "feedbacks": []
    }

@router.post("/feedback", response_model=MessFeedbackResponse)
def submit_mess_feedback(
    data: MessFeedbackCreate,
    student: User = Depends(require_role("STUDENT")),
    db: Session = Depends(get_db)
):
    fb = MessFeedback(
        student_id=student.id,
        menu_item_id=data.menu_item_id,
        rating=max(1, min(5, data.rating)),
        tags=json.dumps(data.tags),
        comment=data.comment,
        created_at=datetime.datetime.utcnow()
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    return {
        "id": fb.id,
        "student_id": fb.student_id,
        "menu_item_id": fb.menu_item_id,
        "rating": fb.rating,
        "tags": data.tags,
        "comment": fb.comment,
        "created_at": fb.created_at
    }

@router.get("/analytics")
def get_mess_analytics(
    mess_user: User = Depends(require_role("MESS", "STAFF", "ADMIN")),
    db: Session = Depends(get_db)
):
    items = db.query(MessMenuItem).order_by(desc(MessMenuItem.date)).limit(30).all()
    item_stats = []
    flagged_low_items = []

    for it in items:
        fbs = db.query(MessFeedback).filter(MessFeedback.menu_item_id == it.id).all()
        if fbs:
            avg = round(sum(f.rating for f in fbs) / len(fbs), 1)
            stat = {
                "id": it.id,
                "name": it.name,
                "meal_type": it.meal_type,
                "date": it.date.isoformat(),
                "average_rating": avg,
                "total_ratings": len(fbs),
                "comments": [f.comment for f in fbs if f.comment]
            }
            item_stats.append(stat)
            if avg < 3.0:
                flagged_low_items.append(stat)

    return {
        "total_menu_items_tracked": len(items),
        "flagged_low_rated_items": flagged_low_items,
        "recent_item_ratings": item_stats[:10],
        "planned_attendance_forecast": {
            "breakfast": 310,
            "lunch": 425,
            "snacks": 280,
            "dinner": 440
        }
    }
