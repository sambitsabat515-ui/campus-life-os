import re
from typing import Dict, Any, Tuple
from app.agents.base import Agent, AgentResult

ROUTING_CONFIG_TABLE = {
    "Plumbing": {
        "department": "Hostel Maintenance & Plumbing Cell",
        "owner_role": "Plumbing Supervisor",
        "sla_hours": 12,
        "default_priority": "MEDIUM"
    },
    "Electrical": {
        "department": "Electrical Substation & Campus Maintenance",
        "owner_role": "Junior Electrical Engineer",
        "sla_hours": 8,
        "default_priority": "HIGH"
    },
    "Mess": {
        "department": "Catering & Mess Supervisory Committee",
        "owner_role": "Mess Inspector",
        "sla_hours": 6,
        "default_priority": "HIGH"
    },
    "Cleanliness": {
        "department": "Sanitation & Campus Hygiene Office",
        "owner_role": "Sanitation Supervisor",
        "sla_hours": 4,
        "default_priority": "MEDIUM"
    },
    "IT": {
        "department": "Campus Network & IT Infrastructure Center",
        "owner_role": "Network Administrator",
        "sla_hours": 12,
        "default_priority": "MEDIUM"
    },
    "Other": {
        "department": "General Estate Management Cell",
        "owner_role": "Estate Officer",
        "sla_hours": 24,
        "default_priority": "LOW"
    }
}

KEYWORD_MAP = {
    "Plumbing": [
        "leak", "leaking", "pipe", "tap", "flush", "basin", "sewage", "toilet",
        "drain", "drainage", "water supply", "faucet", "overflow", "plumber", "shower"
    ],
    "Electrical": [
        "fan", "light", "switch", "socket", "bulb", "tube", "wire", "mcb",
        "voltage", "power cut", "spark", "shock", "short circuit", "dark", "electricity"
    ],
    "Mess": [
        "mess", "food", "curry", "rice", "roti", "cold food", "worm", "insect in food",
        "taste", "dinner", "lunch", "breakfast", "canteen", "stale"
    ],
    "Cleanliness": [
        "garbage", "dustbin", "clean", "dirty", "smell", "foul", "sweep", "sweeper",
        "mopping", "corridor dirty", "waste", "stink"
    ],
    "IT": [
        "wifi", "wi-fi", "internet", "lan", "router", "ethernet", "slow net",
        "portal", "connectivity", "speed", "login failed"
    ]
}

CRITICAL_KEYWORDS = ["spark", "fire", "shock", "flood", "short circuit", "explosion", "severe leak"]
HIGH_KEYWORDS = ["no water", "no power", "9 days", "days", "completely broken", "urgent", "drinking water", "leaking tap"]

class ComplaintRoutingAgent(Agent):
    name = "ComplaintRoutingAgent"

    def _detect_category(self, text: str, explicit_cat: str = "") -> Tuple[str, float]:
        if explicit_cat and explicit_cat in ROUTING_CONFIG_TABLE:
            return explicit_cat, 0.98

        text_lower = text.lower()
        scores = {}
        for cat, kw_list in KEYWORD_MAP.items():
            count = sum(1 for kw in kw_list if re.search(r'\b' + re.escape(kw) + r'\b', text_lower))
            if count > 0:
                scores[cat] = count

        if scores:
            best_cat = max(scores, key=scores.get)
            confidence = min(0.95, 0.6 + scores[best_cat] * 0.15)
            return best_cat, confidence

        return "Other", 0.50

    def _estimate_priority(self, text: str, category: str) -> str:
        text_lower = text.lower()
        for kw in CRITICAL_KEYWORDS:
            if kw in text_lower:
                return "CRITICAL"
        for kw in HIGH_KEYWORDS:
            if kw in text_lower:
                return "HIGH"
        return ROUTING_CONFIG_TABLE.get(category, {}).get("default_priority", "MEDIUM")

    def run(self, input_data: dict) -> AgentResult:
        category_text = input_data.get("category_text", "").strip()
        free_text = input_data.get("free_text", "").strip()
        combined_text = f"{category_text} {free_text}".strip()

        category, cat_confidence = self._detect_category(combined_text, category_text)
        priority = self._estimate_priority(combined_text, category)
        routing_info = ROUTING_CONFIG_TABLE.get(category, ROUTING_CONFIG_TABLE["Other"])

        output = {
            "category": category,
            "department": routing_info["department"],
            "owner_role": routing_info["owner_role"],
            "suggested_priority": priority,
            "sla_hours": routing_info["sla_hours"]
        }

        reasoning = (
            f"Rule match: classified as '{category}' based on keyword patterns; "
            f"assigned to department '{routing_info['department']}' with '{priority}' priority "
            f"per campus routing matrix."
        )

        return AgentResult(
            agent_name=self.name,
            output=output,
            confidence=cat_confidence,
            reasoning=reasoning
        )
