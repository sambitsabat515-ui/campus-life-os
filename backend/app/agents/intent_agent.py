import re
import datetime
from typing import Dict, Any, Optional, Tuple, List
from app.agents.base import Agent, AgentResult

LEAVE_KEYWORDS = [
    "leave", "going home", "night out", "gate pass", "out pass", "permission to go",
    "visiting home", "departure", "cuttack", "bhubaneswar", "weekend home"
]

COMPLAINT_KEYWORDS = [
    "leak", "leaking", "broken", "not working", "repair", "fix", "tap", "fan", "light",
    "switch", "water", "no water", "electricity", "smell", "garbage", "flush", "plumber", "electrician"
]

CERTIFICATE_KEYWORDS = [
    "certificate", "bonafide", "transcript", "migration", "character certificate", "study certificate"
]

BRIEFING_KEYWORDS = [
    "anything important", "today briefing", "what's up", "my day", "updates for me",
    "any notices", "important for me today", "daily digest", "brief me", "status today"
]

ROOM_REGEX = r'\b(?:room\s*(?:no\.?|number)?\s*[:#-]?\s*([0-9]{3,4}[a-zA-Z]?|[a-zA-Z]-[0-9]{3}))\b'
DATE_REGEX = r'\b(?:today|tomorrow|tonight|this weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday|[0-9]{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)\b'

class IntentAgent(Agent):
    name = "IntentAgent"

    def _extract_entities(self, text: str, intent: str) -> Dict[str, Any]:
        text_lower = text.lower()
        entities: Dict[str, Any] = {}

        # Extract Room
        room_match = re.search(ROOM_REGEX, text, re.IGNORECASE)
        if room_match:
            entities["room"] = room_match.group(1).upper()
        else:
            # Fallback room search like 'in 302' or '312'
            fallback_room = re.search(r'\b(?:in|at)\s+([0-9]{3})\b', text_lower)
            if fallback_room:
                entities["room"] = fallback_room.group(1)

        # Extract Date / Time / Duration
        date_match = re.search(DATE_REGEX, text_lower)
        if date_match:
            entities["date_expression"] = date_match.group(0)

        # Extract Destination for leave
        if intent == "TEMPORARY_LEAVE":
            dest_match = re.search(r'\b(?:to|for|going\s+to)\s+([A-Za-z\s]+?)(?:\s+(?:on|for|from|tomorrow|today|this)|\.|$)', text, re.IGNORECASE)
            if dest_match:
                candidate = dest_match.group(1).strip()
                if candidate.lower() not in ["home", "hostel", "my", "a"]:
                    entities["destination"] = candidate
                elif "home" in candidate.lower():
                    entities["destination"] = "Home (Hometown)"
            if not entities.get("destination") and "home" in text_lower:
                entities["destination"] = "Home"

            # Reason extraction
            reason_match = re.search(r'\b(?:because|due\s+to|for|reason:?)\s+([A-Za-z0-9\s]+)', text, re.IGNORECASE)
            if reason_match:
                entities["reason"] = reason_match.group(1).strip()
            elif "urgent" in text_lower:
                entities["reason"] = "Urgent family matter"
            else:
                entities["reason"] = "Personal visit"

        # Extract Complaint specifics
        if intent == "MAINTENANCE_COMPLAINT":
            if any(w in text_lower for w in ["tap", "leak", "pipe", "water", "flush", "basin", "plumber"]):
                entities["category"] = "Plumbing"
            elif any(w in text_lower for w in ["fan", "light", "switch", "bulb", "socket", "power", "electric"]):
                entities["category"] = "Electrical"
            elif any(w in text_lower for w in ["dirty", "garbage", "smell", "dustbin", "clean"]):
                entities["category"] = "Cleanliness"
            elif any(w in text_lower for w in ["wifi", "internet", "lan", "router"]):
                entities["category"] = "IT"
            else:
                entities["category"] = "Other"

            entities["problem_summary"] = text.strip()

        # Extract Certificate type
        if intent == "CERTIFICATE_REQUEST":
            if "bonafide" in text_lower:
                entities["certificate_type"] = "BONAFIDE"
            elif "transcript" in text_lower:
                entities["certificate_type"] = "TRANSCRIPT"
            elif "migration" in text_lower:
                entities["certificate_type"] = "MIGRATION"
            else:
                entities["certificate_type"] = None # needs clarification!

            purpose_match = re.search(r'\b(?:for|purpose:?)\s+([A-Za-z0-9\s]+)', text, re.IGNORECASE)
            if purpose_match:
                entities["purpose"] = purpose_match.group(1).strip()
            else:
                entities["purpose"] = "General official requirement"

        return entities

    def run(self, input_data: dict) -> AgentResult:
        query = input_data.get("query", "").strip()
        query_lower = query.lower()

        scores = {
            "TEMPORARY_LEAVE": sum(2 for k in LEAVE_KEYWORDS if k in query_lower),
            "MAINTENANCE_COMPLAINT": sum(2 for k in COMPLAINT_KEYWORDS if k in query_lower),
            "CERTIFICATE_REQUEST": sum(2 for k in CERTIFICATE_KEYWORDS if k in query_lower),
            "BRIEFING_REQUEST": sum(2 for k in BRIEFING_KEYWORDS if k in query_lower),
        }

        best_intent = max(scores, key=scores.get)
        best_score = scores[best_intent]

        if best_score == 0:
            best_intent = "UNKNOWN"
            confidence = 0.35
        else:
            confidence = min(0.96, 0.60 + best_score * 0.12)

        entities = self._extract_entities(query, best_intent)

        # Check for missing required entities and form clarifying question
        needs_clarification = False
        clarification_question = None

        if best_intent == "MAINTENANCE_COMPLAINT":
            if not entities.get("room"):
                needs_clarification = True
                clarification_question = "Which room or block should we dispatch maintenance to? (e.g., 'Room 302, Aryabhatta Hall')"
        elif best_intent == "TEMPORARY_LEAVE":
            if not entities.get("destination"):
                needs_clarification = True
                clarification_question = "Where are you traveling to, and on what date? (e.g., 'Home to Cuttack tomorrow at 5 PM')"
        elif best_intent == "CERTIFICATE_REQUEST":
            if not entities.get("certificate_type"):
                needs_clarification = True
                clarification_question = "Which certificate do you need: Bonafide, Official Transcript, or Migration?"
        elif best_intent == "UNKNOWN":
            needs_clarification = True
            clarification_question = "I could not resolve your exact intent. Would you like to raise a hostel complaint, request a gate pass, or check today's notices?"

        output = {
            "intent": best_intent,
            "confidence": confidence,
            "entities": entities,
            "needs_clarification": needs_clarification,
            "clarification_question": clarification_question,
            "raw_input": query
        }

        reasoning = (
            f"Classified intent as '{best_intent}' (confidence: {confidence:.2f}). "
            f"Extracted entities: {entities}. "
            f"Clarification required: {needs_clarification}."
        )

        return AgentResult(
            agent_name=self.name,
            output=output,
            confidence=confidence,
            reasoning=reasoning
        )
