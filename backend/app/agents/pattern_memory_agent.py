import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.agents.base import Agent, AgentResult
from app.db.models import Complaint, Incident, ComplaintAuditTrail

class PatternMemoryAgent(Agent):
    name = "PatternMemoryAgent"

    def run(self, input_data: dict) -> AgentResult:
        """
        Input: {
            "db": Session,
            "place": str,
            "category": str,
            "room": Optional[str],
            "immediate_hours": Optional[float] = 2.0,
            "chronic_days": Optional[int] = 30
        }
        """
        db: Session = input_data.get("db")
        place = input_data.get("place", "").strip()
        category = input_data.get("category", "").strip()
        room = input_data.get("room", "").strip()
        immediate_hours = input_data.get("immediate_hours", 2.0)
        chronic_days = input_data.get("chronic_days", 30)

        now = datetime.datetime.utcnow()
        immediate_cutoff = now - datetime.timedelta(hours=immediate_hours)
        chronic_cutoff = now - datetime.timedelta(days=chronic_days)

        # 1. Immediate spike query (within immediate_hours)
        immediate_query = db.query(Complaint).filter(
            Complaint.category == category,
            Complaint.place == place,
            Complaint.created_at >= immediate_cutoff
        )
        immediate_complaints = immediate_query.all()
        immediate_ids = [c.id for c in immediate_complaints]

        # 2. Chronic room/place query (within chronic_days)
        chronic_query = db.query(Complaint).filter(
            Complaint.category == category,
            Complaint.place == place,
            Complaint.created_at >= chronic_cutoff
        )
        if room:
            chronic_query = chronic_query.filter(Complaint.room == room)
        chronic_complaints = chronic_query.all()
        chronic_ids = [c.id for c in chronic_complaints]

        is_immediate_spike = len(immediate_complaints) >= 2
        is_chronic = len(chronic_complaints) >= 3

        suggested_title = None
        if is_chronic and room:
            suggested_title = f"Chronic {category} Breakdown: {place} Room {room} ({len(chronic_complaints)} reports in {chronic_days}d)"
        elif is_immediate_spike:
            suggested_title = f"Urgent Outage Alert: Multiple {category} failures at {place} ({len(immediate_complaints)} reports in {immediate_hours}h)"
        elif len(chronic_complaints) >= 2:
            suggested_title = f"Recurring {category} alert for {place} ({len(chronic_complaints)} recent tickets)"

        cluster_data = {
            "place": place,
            "category": category,
            "room": room,
            "immediate_count": len(immediate_complaints),
            "immediate_complaint_ids": immediate_ids,
            "is_immediate_spike": is_immediate_spike,
            "chronic_count": len(chronic_complaints),
            "chronic_complaint_ids": chronic_ids,
            "is_chronic": is_chronic,
            "suggested_incident_title": suggested_title,
            "related_complaints": [
                {
                    "id": c.id,
                    "title": c.title,
                    "room": c.room,
                    "status": c.status,
                    "priority": c.priority,
                    "created_at": c.created_at.isoformat() if c.created_at else None
                }
                for c in chronic_complaints
            ]
        }

        reasoning = (
            f"Deterministic pattern match for {place} / {category}: "
            f"{len(immediate_complaints)} complaints in past {immediate_hours}h "
            f"({'SPIKE' if is_immediate_spike else 'normal'}); "
            f"{len(chronic_complaints)} complaints in past {chronic_days}d "
            f"({'CHRONIC' if is_chronic else 'isolated'})."
        )

        confidence = 1.0  # Deterministic SQL counting

        return AgentResult(
            agent_name=self.name,
            output=cluster_data,
            confidence=confidence,
            reasoning=reasoning
        )

    @staticmethod
    def merge_cluster_to_incident(
        db: Session,
        complaint_ids: List[int],
        title: str,
        category: str,
        place: str,
        admin_user_id: int,
        description: Optional[str] = None
    ) -> Incident:
        """Exposes an admin action to merge a cluster into a confirmed Incident"""
        incident = Incident(
            title=title,
            category=category,
            place=place,
            description=description or f"Merged incident from {len(complaint_ids)} related tickets.",
            status="INVESTIGATING",
            created_at=datetime.datetime.utcnow()
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        complaints = db.query(Complaint).filter(Complaint.id.in_(complaint_ids)).all()
        for c in complaints:
            prev_status = c.status
            c.incident_id = incident.id
            c.status = "ASSIGNED"
            c.priority = "HIGH"
            audit = ComplaintAuditTrail(
                complaint_id=c.id,
                action="MERGED_INTO_INCIDENT",
                performed_by=admin_user_id,
                previous_status=prev_status,
                new_status="ASSIGNED",
                note=f"Merged into Incident #{incident.id}: {title}",
                timestamp=datetime.datetime.utcnow()
            )
            db.add(audit)

        db.commit()
        return incident
