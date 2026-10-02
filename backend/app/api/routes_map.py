import os
import shutil
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, CampusMap, MapPin, Complaint
from app.auth.security import require_role
from app.schemas import MapPinCreate, MapPinResponse, CampusMapResponse
from app.config import settings

router = APIRouter(prefix="/api/map", tags=["3D Campus Map & Navigation"])

# Predefined landmark routes graph
CAMPUS_WAYPOINTS = {
    "Main Campus Gate": {"x": 0.0, "y": 0.5, "z": 10.0},
    "Central Library": {"x": 3.0, "y": 0.5, "z": 1.0},
    "Administrative Block": {"x": -5.0, "y": 0.5, "z": 2.0},
    "Academic Block (CSE/ECE)": {"x": 6.0, "y": 0.5, "z": -3.0},
    "Aryabhatta Boys Hostel": {"x": -8.0, "y": 0.5, "z": -7.0},
    "Central Mess Hall": {"x": -6.0, "y": 0.5, "z": -8.0},
    "Gargi Girls Hostel": {"x": -12.0, "y": 0.5, "z": -2.0}
}

ROUTE_DIRECTIONS = {
    ("Aryabhatta Boys Hostel", "Administrative Block"): [
        {"step": 1, "text": "Exit Aryabhatta Hostel main entrance and take the paved western walkway.", "checkpoint": [-8.0, 0.5, -7.0]},
        {"step": 2, "text": "Walk straight past the Central Mess Hall lawn towards the clock tower.", "checkpoint": [-6.0, 0.5, -3.0]},
        {"step": 3, "text": "Turn right at the Student Plaza and enter the Administrative Block atrium (Counter #2).", "checkpoint": [-5.0, 0.5, 2.0]}
    ],
    ("Aryabhatta Boys Hostel", "Main Campus Gate"): [
        {"step": 1, "text": "Depart hostel porch heading south along the central avenue.", "checkpoint": [-8.0, 0.5, -7.0]},
        {"step": 2, "text": "Pass Central Library on your left side.", "checkpoint": [0.0, 0.5, 2.0]},
        {"step": 3, "text": "Reach Main Campus Gate Security Checkpoint for Gate Pass validation.", "checkpoint": [0.0, 0.5, 10.0]}
    ],
    ("Aryabhatta Boys Hostel", "Academic Block (CSE/ECE)"): [
        {"step": 1, "text": "Head eastward across the quadrangle.", "checkpoint": [-4.0, 0.5, -5.0]},
        {"step": 2, "text": "Cross the botanical corridor in front of Central Library.", "checkpoint": [2.0, 0.5, -1.0]},
        {"step": 3, "text": "Enter Academic Block foyer; Lecture Halls LH-101 to LH-106 are on the 1st floor.", "checkpoint": [6.0, 0.5, -3.0]}
    ]
}

@router.get("/current")
def get_current_campus_map(db: Session = Depends(get_db)):
    campus_map = db.query(CampusMap).filter(CampusMap.is_active == True).first()
    if not campus_map:
        # Create a default entry if not existing
        campus_map = CampusMap(glb_path="/models/campus_prototype.glb", uploaded_by=1, is_active=True)
        db.add(campus_map)
        db.commit()
        db.refresh(campus_map)

    pins = db.query(MapPin).filter(MapPin.campus_map_id == campus_map.id).all()

    # Calculate live X-Ray beacon status for each building based on real Complaint table!
    open_complaints = db.query(Complaint).filter(Complaint.status != "RESOLVED").all()
    pin_beacons = []

    for p in pins:
        matching_complaints = [c for c in open_complaints if p.label.lower() in c.place.lower() or c.place.lower() in p.label.lower()]
        
        status_color = "GREEN" # all resolved / clear
        severity_score = 0
        if matching_complaints:
            has_critical = any(c.priority == "CRITICAL" for c in matching_complaints)
            has_ageing_72 = any(c.created_at and (datetime.datetime.utcnow() - c.created_at).total_seconds() > 72*3600 for c in matching_complaints)
            if has_critical or has_ageing_72:
                status_color = "RED" # critical / overdue
                severity_score = 3
            else:
                status_color = "AMBER" # pending issues
                severity_score = 1

        pin_beacons.append({
            "id": p.id,
            "label": p.label,
            "description": p.description,
            "x": p.x,
            "y": p.y,
            "z": p.z,
            "beacon_status": status_color, # RED, AMBER, GREEN
            "severity_score": severity_score,
            "open_tickets_count": len(matching_complaints),
            "open_tickets": [
                {
                    "id": c.id,
                    "title": c.title,
                    "category": c.category,
                    "room": c.room,
                    "priority": c.priority,
                    "status": c.status,
                    "age_hours": round((datetime.datetime.utcnow() - c.created_at).total_seconds() / 3600.0, 1) if c.created_at else 0
                }
                for c in matching_complaints
            ]
        })

    return {
        "id": campus_map.id,
        "glb_path": campus_map.glb_path,
        "is_active": campus_map.is_active,
        "pins": pin_beacons
    }

@router.post("/pins", response_model=MapPinResponse)
def add_map_pin(data: MapPinCreate, admin: User = Depends(require_role("ADMIN")), db: Session = Depends(get_db)):
    pin = MapPin(
        campus_map_id=data.campus_map_id,
        label=data.label,
        description=data.description,
        x=data.x,
        y=data.y,
        z=data.z
    )
    db.add(pin)
    db.commit()
    db.refresh(pin)
    return pin

@router.delete("/pins/{pin_id}")
def delete_map_pin(pin_id: int, admin: User = Depends(require_role("ADMIN")), db: Session = Depends(get_db)):
    pin = db.query(MapPin).filter(MapPin.id == pin_id).first()
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")
    db.delete(pin)
    db.commit()
    return {"status": "success", "deleted_pin_id": pin_id}

@router.get("/navigation-route")
def get_navigation_route(
    start: str = "Aryabhatta Boys Hostel",
    destination: str = "Administrative Block"
):
    route_key = (start, destination)
    reverse_key = (destination, start)

    steps = ROUTE_DIRECTIONS.get(route_key)
    if not steps:
        # Default procedural route
        start_pt = CAMPUS_WAYPOINTS.get(start, {"x": -8.0, "y": 0.5, "z": -7.0})
        end_pt = CAMPUS_WAYPOINTS.get(destination, {"x": -5.0, "y": 0.5, "z": 2.0})
        steps = [
            {"step": 1, "text": f"Depart from {start}.", "checkpoint": [start_pt["x"], start_pt["y"], start_pt["z"]]},
            {"step": 2, "text": "Follow main central connector pathway.", "checkpoint": [(start_pt["x"] + end_pt["x"]) / 2, 0.5, (start_pt["z"] + end_pt["z"]) / 2]},
            {"step": 3, "text": f"Arrive at destination: {destination}.", "checkpoint": [end_pt["x"], end_pt["y"], end_pt["z"]]}
        ]

    checkpoints = [s["checkpoint"] for s in steps]

    return {
        "start": start,
        "destination": destination,
        "steps": steps,
        "checkpoints": checkpoints,
        "estimated_walking_minutes": 3,
        "text_directions": [f"Step {s['step']}: {s['text']}" for s in steps]
    }

@router.post("/upload-glb")
def upload_glb_model(
    file: UploadFile = File(...),
    admin: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    upload_dir = settings.UPLOAD_DIR / "models"
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    campus_map = CampusMap(
        glb_path=f"/uploads/models/{file.filename}",
        uploaded_by=admin.id,
        is_active=True
    )
    db.add(campus_map)
    db.commit()
    db.refresh(campus_map)

    return {"status": "success", "map_id": campus_map.id, "glb_path": campus_map.glb_path}
