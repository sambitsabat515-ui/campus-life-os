import re
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Complaint, ComplaintAuditTrail, Attendance, MessMenuItem, MessHall, GatePass
from app.schemas import SmsWebhookRequest, SmsWebhookResponse
from app.agents.complaint_routing_agent import ComplaintRoutingAgent
from app.agents.pattern_memory_agent import PatternMemoryAgent

router = APIRouter(prefix="/api", tags=["Accessibility & SMS Fallback"])
routing_agent = ComplaintRoutingAgent()
pattern_agent = PatternMemoryAgent()

@router.post("/sms-webhook", response_model=SmsWebhookResponse)
def handle_sms_webhook(data: SmsWebhookRequest, db: Session = Depends(get_db)):
    sender = data.sender_phone.strip()
    msg = data.message.strip()
    msg_upper = msg.upper()

    # Locate student by phone or use default demo student
    student = db.query(User).filter(User.phone == sender).first()
    if not student:
        # Default to primary student for testing/simulator convenience
        student = db.query(User).filter(User.role == "STUDENT").first()

    now = datetime.datetime.utcnow()

    # 1. COMPLAINT <text>
    if msg_upper.startswith("COMPLAINT"):
        complaint_text = msg[9:].strip()
        if not complaint_text:
            return {
                "status": "error",
                "reply_message": "Error: Empty complaint. Use format: COMPLAINT <your issue details and room number>",
                "command_detected": "COMPLAINT"
            }

        # Run routing agent
        agent_res = routing_agent.run({
            "category_text": "",
            "free_text": complaint_text
        })
        category = agent_res.output.get("category", "Other")
        priority = agent_res.output.get("suggested_priority", "MEDIUM")
        dept = agent_res.output.get("department", "Hostel Maintenance")
        sla = agent_res.output.get("sla_hours", 12)

        # Extract room if mentioned, else student's room
        room_match = re.search(r'\b[0-9]{3}\b', complaint_text)
        room = room_match.group(0) if room_match else (student.room if student else "302")
        place = student.hostel if student else "Aryabhatta Hall"

        new_complaint = Complaint(
            student_id=student.id if student else 1,
            category=category,
            title=complaint_text[:100],
            description=complaint_text,
            place=place,
            room=room,
            priority=priority,
            status="OPEN",
            created_at=now
        )
        db.add(new_complaint)
        db.commit()
        db.refresh(new_complaint)

        audit = ComplaintAuditTrail(
            complaint_id=new_complaint.id,
            action="CREATED_VIA_SMS",
            performed_by=student.id if student else 1,
            new_status="OPEN",
            note=f"Logged via SMS endpoint from {sender}. Routed to {dept}.",
            timestamp=now
        )
        db.add(audit)
        db.commit()

        # Pattern check
        pattern_res = pattern_agent.run({
            "db": db, "place": place, "category": category, "room": room
        })

        reply = (
            f"BPUT-OS: Ticket #{new_complaint.id} logged. Cat: {category} ({priority}). "
            f"Assigned: {dept}. Target resolution within {sla}h."
        )
        if pattern_res.output.get("is_chronic") or pattern_res.output.get("is_immediate_spike"):
            reply += " [ALERT: Cluster detected - escalated to Admin!]"

        return {
            "status": "success",
            "reply_message": reply,
            "command_detected": "COMPLAINT"
        }

    # 2. ATTENDANCE
    elif msg_upper.startswith("ATTENDANCE"):
        records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
        if not records:
            return {
                "status": "success",
                "reply_message": f"BPUT-OS: No attendance entries found for Roll {student.roll_no}.",
                "command_detected": "ATTENDANCE"
            }

        present_cnt = sum(1 for r in records if r.status == "PRESENT")
        total = len(records)
        pct = round((present_cnt / total) * 100, 1)

        status_flag = "OK" if pct >= 75.0 else "WARNING: SHORTAGE (<75%)"
        reply = (
            f"BPUT-OS: Attendance for {student.name} ({student.roll_no}): {pct}% [{status_flag}]. "
            f"Total sessions: {present_cnt}/{total}."
        )
        return {
            "status": "success",
            "reply_message": reply,
            "command_detected": "ATTENDANCE"
        }

    # 3. MENU TODAY
    elif msg_upper.startswith("MENU TODAY") or msg_upper == "MENU":
        today = datetime.date.today()
        items = db.query(MessMenuItem).filter(MessMenuItem.date == today).all()
        if not items:
            reply = "BPUT-OS: Today's menu is standard hostel rotation (Breakfast 7:30AM, Lunch 12:30PM, Dinner 8PM)."
        else:
            parts = []
            for it in items:
                parts.append(f"{it.meal_type.capitalize()}: {it.name[:25]}")
            reply = f"BPUT-OS Today's Mess: " + " | ".join(parts)

        return {
            "status": "success",
            "reply_message": reply,
            "command_detected": "MENU TODAY"
        }

    # 4. STATUS <id>
    elif msg_upper.startswith("STATUS"):
        parts = msg.split()
        if len(parts) < 2 or not parts[1].isdigit():
            return {
                "status": "error",
                "reply_message": "Error: Please specify ticket id. Format: STATUS <ticket_id>",
                "command_detected": "STATUS"
            }
        t_id = int(parts[1])
        complaint = db.query(Complaint).filter(Complaint.id == t_id).first()
        if complaint:
            reply = (
                f"BPUT-OS: Ticket #{complaint.id} [{complaint.category}] Status: {complaint.status}. "
                f"Location: {complaint.place} Rm {complaint.room}. Priority: {complaint.priority}."
            )
            return {"status": "success", "reply_message": reply, "command_detected": "STATUS"}

        gp = db.query(GatePass).filter(GatePass.id == t_id).first()
        if gp:
            reply = f"BPUT-OS: GatePass #{gp.id} to {gp.destination}. Status: {gp.status}."
            return {"status": "success", "reply_message": reply, "command_detected": "STATUS"}

        return {
            "status": "error",
            "reply_message": f"BPUT-OS: Record #{t_id} not found.",
            "command_detected": "STATUS"
        }

    # Unrecognized fallback
    return {
        "status": "unknown_command",
        "reply_message": "BPUT-OS SMS Helper. Valid formats: COMPLAINT <details>, ATTENDANCE, MENU TODAY, STATUS <id>.",
        "command_detected": "UNKNOWN"
    }
