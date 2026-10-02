import datetime
import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.db.session import get_db
from app.db.models import (
    User, AskRequest, Complaint, GatePass, CertificateRequest, Notice, ComplaintAuditTrail
)
from app.auth.security import get_current_user
from app.schemas import AskCampusRequest, AskCampusResponse
from app.agents.intent_agent import IntentAgent
from app.agents.policy_agent import PolicyAgent
from app.agents.pattern_memory_agent import PatternMemoryAgent
from app.agents.complaint_routing_agent import ComplaintRoutingAgent

router = APIRouter(prefix="/api/ask", tags=["Ask Campus Intent Layer"])
intent_agent = IntentAgent()
policy_agent = PolicyAgent()
pattern_agent = PatternMemoryAgent()
routing_agent = ComplaintRoutingAgent()

@router.post("/query", response_model=AskCampusResponse)
def handle_ask_campus(
    data: AskCampusRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.datetime.utcnow()
    query = data.query.strip()

    # 1. Run hand-built Intent Agent
    intent_res = intent_agent.run({"query": query})
    intent_out = intent_res.output
    intent = intent_out.get("intent", "UNKNOWN")
    confidence = intent_res.confidence or 0.5
    entities = intent_out.get("entities", {})
    needs_clarification = intent_out.get("needs_clarification", False)
    clarification_q = intent_out.get("clarification_question")

    message = ""
    workflow = None
    linked_complaint_id = None
    linked_gatepass_id = None

    if needs_clarification:
        message = clarification_q or "Could you please clarify your request with more specifics?"
        explainability = {
            "raw_text": query,
            "detected_intent": intent,
            "confidence": round(confidence, 2),
            "extracted_entities": entities,
            "reasoning": intent_res.reasoning,
            "action_taken": "PAUSED_FOR_CLARIFICATION"
        }
        # Log ask request
        ask_req = AskRequest(
            student_id=user.id,
            raw_text=query,
            intent=intent,
            confidence=confidence,
            entities=json.dumps(entities),
            created_at=now
        )
        db.add(ask_req)
        db.commit()

        return {
            "intent": intent,
            "confidence": confidence,
            "entities": entities,
            "message": message,
            "needs_clarification": True,
            "clarification_question": clarification_q,
            "workflow": None,
            "linked_id": None,
            "explainability": explainability
        }

    # 2. Coordinate actual workflows on real database models
    if intent == "TEMPORARY_LEAVE":
        # Extract fields
        destination = entities.get("destination", "Home (Hometown)")
        reason = entities.get("reason", "Personal / Leave request")
        dep_time = now + datetime.timedelta(days=1, hours=2)
        exp_return = now + datetime.timedelta(days=3, hours=4)

        # Pull canonical policy approval chain from PolicyAgent
        p_res = policy_agent.run({"policy_type": "GATE_PASS", "current_status": "PENDING"})
        chain = p_res.output.get("approval_chain", [])

        # Create real GatePass record!
        new_gp = GatePass(
            student_id=user.id,
            reason=reason,
            destination=destination,
            departure_time=dep_time,
            expected_return=exp_return,
            approver_chain=json.dumps(chain),
            status="PENDING",
            created_at=now
        )
        db.add(new_gp)
        db.commit()
        db.refresh(new_gp)
        linked_gatepass_id = new_gp.id

        workflow = {
            "type": "GATE_PASS",
            "record_id": new_gp.id,
            "steps": chain,
            "current_status": "PENDING",
            "next_action": "Faculty Proctor Verification (AMBER - awaiting human sign-off)"
        }
        message = (
            f"Gate Pass request #{new_gp.id} created to {destination}. "
            "Policy approval chain initialized. Proctor verification is currently pending."
        )

    elif intent == "MAINTENANCE_COMPLAINT":
        cat = entities.get("category", "Plumbing")
        room = entities.get("room", user.room or "302")
        place = user.hostel or "Aryabhatta Hall"

        # Auto-routing lookup
        route_res = routing_agent.run({"category_text": cat, "free_text": query})
        dept = route_res.output.get("department")
        prio = route_res.output.get("suggested_priority", "MEDIUM")

        # Find staff
        staff_user = db.query(User).filter(User.role == "STAFF").first()

        new_comp = Complaint(
            student_id=user.id,
            category=cat,
            title=f"Maintenance: {query[:60]}",
            description=query,
            place=place,
            room=room,
            priority=prio,
            status="OPEN",
            assigned_to=staff_user.id if staff_user else None,
            created_at=now
        )
        db.add(new_comp)
        db.commit()
        db.refresh(new_comp)
        linked_complaint_id = new_comp.id

        audit = ComplaintAuditTrail(
            complaint_id=new_comp.id,
            action="CREATED_VIA_ASK_CAMPUS",
            performed_by=user.id,
            previous_status=None,
            new_status="OPEN",
            note=f"Created via Ask Campus natural language prompt. Routed to {dept}.",
            timestamp=now
        )
        db.add(audit)
        db.commit()

        # REUSE SAME PATTERN MEMORY AGENT (Section 7.2 & 13)
        pattern_res = pattern_agent.run({
            "db": db,
            "place": place,
            "category": cat,
            "room": room
        })

        policy_res = policy_agent.run({"policy_type": "MAINTENANCE_COMPLAINT", "current_status": "OPEN"})

        cluster_info = None
        if pattern_res.output.get("is_chronic") or pattern_res.output.get("is_immediate_spike"):
            cluster_info = {
                "alert": pattern_res.output.get("suggested_incident_title"),
                "chronic_count": pattern_res.output.get("chronic_count"),
                "immediate_count": pattern_res.output.get("immediate_count")
            }

        workflow = {
            "type": "MAINTENANCE_COMPLAINT",
            "record_id": new_comp.id,
            "steps": policy_res.output.get("approval_chain", []),
            "current_status": "OPEN",
            "cluster_pattern_detected": cluster_info,
            "assigned_department": dept
        }

        pattern_addon = f" Note: System surfaced related complaint history ({pattern_res.output.get('chronic_count')} recent tickets in {place} {room})." if cluster_info else ""
        message = f"Maintenance ticket #{new_comp.id} logged for {cat} in Room {room} and routed to {dept}.{pattern_addon}"

    elif intent == "CERTIFICATE_REQUEST":
        cert_type = entities.get("certificate_type", "BONAFIDE")
        purpose = entities.get("purpose", "Official requirement")

        new_cert = CertificateRequest(
            student_id=user.id,
            type=cert_type,
            purpose=purpose,
            status="PENDING",
            requested_at=now
        )
        db.add(new_cert)
        db.commit()
        db.refresh(new_cert)

        c_policy = policy_agent.run({"policy_type": "CERTIFICATE_REQUEST", "current_status": "PENDING"})

        workflow = {
            "type": "CERTIFICATE_REQUEST",
            "record_id": new_cert.id,
            "steps": c_policy.output.get("approval_chain", []),
            "current_status": "PENDING",
            "next_action": "Academic Section Clearance"
        }
        message = f"Application for {cert_type} Certificate #{new_cert.id} recorded. Verification workflow started."

    elif intent == "BRIEFING_REQUEST":
        # Pull personalized digest: Notices + pending requests tagged INFO / ACTION / DEADLINE / STATUS
        notices = db.query(Notice).filter(
            or_(
                Notice.target_type == "ALL",
                (Notice.target_type == "BRANCH") & (Notice.target_value == user.branch),
                (Notice.target_type == "HOSTEL") & (Notice.target_value == user.hostel),
                (Notice.target_type == "YEAR") & (Notice.target_value == str(user.year))
            )
        ).order_by(desc(Notice.created_at)).limit(3).all()

        briefing_items = []
        for n in notices:
            tag = "DEADLINE" if "exam" in n.title.lower() or "fee" in n.title.lower() else "INFO"
            briefing_items.append({
                "tag": tag,
                "title": n.title,
                "detail": n.body[:120] + "...",
                "source": "Campus Notice"
            })

        # Check pending requests for action/status
        open_gps = db.query(GatePass).filter(GatePass.student_id == user.id, GatePass.status == "PENDING").all()
        for gp in open_gps:
            briefing_items.append({
                "tag": "STATUS",
                "title": f"Gate Pass #{gp.id} Pending Approval",
                "detail": f"Travel to {gp.destination} awaits Warden endorsement.",
                "source": "Gate Pass Tracker"
            })

        open_certs = db.query(CertificateRequest).filter(CertificateRequest.student_id == user.id, CertificateRequest.status != "COLLECTED").all()
        for c in open_certs:
            briefing_items.append({
                "tag": "ACTION" if c.status == "READY" else "STATUS",
                "title": f"{c.type} Certificate is {c.status}",
                "detail": "Ready for digital download or counter pickup." if c.status == "READY" else "Under verification in Academic Block.",
                "source": "Certificate Desk"
            })

        workflow = {
            "type": "BRIEFING_DIGEST",
            "items": briefing_items
        }
        message = f"Here is your personalized campus briefing for today ({len(briefing_items)} high-priority items)."

    explainability = {
        "raw_text": query,
        "detected_intent": intent,
        "confidence": round(confidence, 2),
        "extracted_entities": entities,
        "reasoning": intent_res.reasoning,
        "policy_governed": True,
        "action_taken": "COORDINATED_LIVE_WORKFLOW"
    }

    # Log ask request history
    ask_req = AskRequest(
        student_id=user.id,
        raw_text=query,
        intent=intent,
        confidence=confidence,
        entities=json.dumps(entities),
        linked_complaint_id=linked_complaint_id,
        linked_gatepass_id=linked_gatepass_id,
        created_at=now
    )
    db.add(ask_req)
    db.commit()

    return {
        "intent": intent,
        "confidence": confidence,
        "entities": entities,
        "message": message,
        "needs_clarification": False,
        "clarification_question": None,
        "workflow": workflow,
        "linked_id": linked_gatepass_id or linked_complaint_id,
        "explainability": explainability
    }

@router.get("/history")
def get_ask_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(AskRequest).filter(AskRequest.student_id == user.id).order_by(desc(AskRequest.created_at)).limit(10).all()
    results = []
    for r in requests:
        results.append({
            "id": r.id,
            "raw_text": r.raw_text,
            "intent": r.intent,
            "confidence": round(r.confidence, 2),
            "entities": json.loads(r.entities) if r.entities else {},
            "created_at": r.created_at
        })
    return results
