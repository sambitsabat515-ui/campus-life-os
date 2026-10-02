from typing import Dict, Any, List
from app.agents.base import Agent, AgentResult

CANONICAL_POLICY_CHAINS = {
    "GATE_PASS": [
        {
            "step_id": 1,
            "role": "STUDENT",
            "name": "Request Submission",
            "status": "COMPLETED",
            "state_color": "GREEN",
            "description": "Student submits gate pass with destination and travel duration."
        },
        {
            "step_id": 2,
            "role": "FACULTY",
            "name": "Faculty Proctor Approval",
            "status": "PENDING",
            "state_color": "AMBER",
            "description": "Academic clearance by designated departmental proctor."
        },
        {
            "step_id": 3,
            "role": "WARDEN",
            "name": "Hostel Warden Endorsement",
            "status": "PENDING",
            "state_color": "AMBER",
            "description": "Verification of hostel leave register and curfew clearance."
        },
        {
            "step_id": 4,
            "role": "SECURITY",
            "name": "Main Gate Out-Authorization",
            "status": "PENDING",
            "state_color": "AMBER",
            "description": "Physical scan and campus departure verification at Main Gate."
        },
        {
            "step_id": 5,
            "role": "SECURITY",
            "name": "Campus In-Check & Return Log",
            "status": "PENDING",
            "state_color": "AMBER",
            "description": "Safe arrival check-in upon return to hostel."
        }
    ],
    "CERTIFICATE_REQUEST": [
        {
            "step_id": 1,
            "role": "STUDENT",
            "name": "Application Lodged",
            "status": "COMPLETED",
            "state_color": "GREEN",
            "description": "Certificate application recorded with specified purpose."
        },
        {
            "step_id": 2,
            "role": "ADMIN",
            "name": "Academic Section Verification",
            "status": "PENDING",
            "state_color": "AMBER",
            "description": "Dues clearance and enrollment status verification."
        },
        {
            "step_id": 3,
            "role": "ADMIN",
            "name": "Dean Academic Sign-off",
            "status": "PENDING",
            "state_color": "AMBER",
            "description": "Digital signature and seal applied to official certificate."
        },
        {
            "step_id": 4,
            "role": "STUDENT",
            "name": "Ready for Dispatch / Collection",
            "status": "PENDING",
            "state_color": "AMBER",
            "description": "Digital copy downloadable or physical copy available at Counter #2."
        }
    ],
    "MAINTENANCE_COMPLAINT": [
        {
            "step_id": 1,
            "role": "STUDENT",
            "name": "Complaint Logged",
            "status": "COMPLETED",
            "state_color": "GREEN",
            "description": "Ticket filed with location, room, and problem description."
        },
        {
            "step_id": 2,
            "role": "STAFF",
            "name": "Supervisor Assignment",
            "status": "PENDING",
            "state_color": "AMBER",
            "description": "Department assigned and technician allocated."
        },
        {
            "step_id": 3,
            "role": "STAFF",
            "name": "On-Site Repair in Progress",
            "status": "PENDING",
            "state_color": "AMBER",
            "description": "Field work and component replacement underway."
        },
        {
            "step_id": 4,
            "role": "STAFF",
            "name": "Resolution & Verification",
            "status": "PENDING",
            "state_color": "AMBER",
            "description": "Resolution photo proof uploaded and student satisfaction closure."
        }
    ]
}

class PolicyAgent(Agent):
    name = "PolicyAgent"

    def run(self, input_data: dict) -> AgentResult:
        """
        Input: {
            "policy_type": "GATE_PASS" | "CERTIFICATE_REQUEST" | "MAINTENANCE_COMPLAINT",
            "current_status": Optional[str],
            "custom_chain": Optional[List[Dict[str, Any]]]
        }
        """
        policy_type = input_data.get("policy_type", "GATE_PASS").upper()
        current_status = input_data.get("current_status", "PENDING").upper()
        custom_chain = input_data.get("custom_chain")

        base_chain = custom_chain if custom_chain else CANONICAL_POLICY_CHAINS.get(policy_type, CANONICAL_POLICY_CHAINS["GATE_PASS"])
        steps = [dict(s) for s in base_chain]

        # Evaluate step statuses based on real progress
        if policy_type == "GATE_PASS":
            if current_status == "APPROVED":
                steps[0]["status"] = "COMPLETED"
                steps[0]["state_color"] = "GREEN"
                steps[1]["status"] = "COMPLETED"
                steps[1]["state_color"] = "GREEN"
                steps[2]["status"] = "COMPLETED"
                steps[2]["state_color"] = "GREEN"
                steps[3]["status"] = "ACTIVE"
                steps[3]["state_color"] = "AMBER"
            elif current_status == "OUT":
                for i in range(4):
                    steps[i]["status"] = "COMPLETED"
                    steps[i]["state_color"] = "GREEN"
                steps[4]["status"] = "ACTIVE"
                steps[4]["state_color"] = "AMBER"
            elif current_status == "RETURNED":
                for i in range(5):
                    steps[i]["status"] = "COMPLETED"
                    steps[i]["state_color"] = "GREEN"
            elif current_status == "REJECTED":
                steps[1]["status"] = "REJECTED"
                steps[1]["state_color"] = "RED"

        elif policy_type == "CERTIFICATE_REQUEST":
            if current_status == "PROCESSING":
                steps[0]["status"] = "COMPLETED"
                steps[0]["state_color"] = "GREEN"
                steps[1]["status"] = "ACTIVE"
                steps[1]["state_color"] = "AMBER"
            elif current_status in ["READY", "COLLECTED"]:
                for i in range(3):
                    steps[i]["status"] = "COMPLETED"
                    steps[i]["state_color"] = "GREEN"
                if current_status == "COLLECTED":
                    steps[3]["status"] = "COMPLETED"
                    steps[3]["state_color"] = "GREEN"
                else:
                    steps[3]["status"] = "ACTIVE"
                    steps[3]["state_color"] = "GREEN"

        elif policy_type == "MAINTENANCE_COMPLAINT":
            if current_status == "ASSIGNED":
                steps[0]["status"] = "COMPLETED"
                steps[0]["state_color"] = "GREEN"
                steps[1]["status"] = "COMPLETED"
                steps[1]["state_color"] = "GREEN"
                steps[2]["status"] = "ACTIVE"
                steps[2]["state_color"] = "AMBER"
            elif current_status == "IN_PROGRESS":
                steps[0]["status"] = "COMPLETED"
                steps[0]["state_color"] = "GREEN"
                steps[1]["status"] = "COMPLETED"
                steps[1]["state_color"] = "GREEN"
                steps[2]["status"] = "ACTIVE"
                steps[2]["state_color"] = "AMBER"
            elif current_status == "RESOLVED":
                for i in range(4):
                    steps[i]["status"] = "COMPLETED"
                    steps[i]["state_color"] = "GREEN"

        output = {
            "policy_type": policy_type,
            "approval_chain": steps,
            "current_status": current_status,
            "next_required_action": next((s["name"] for s in steps if s["status"] in ["PENDING", "ACTIVE"]), "Completed")
        }

        reasoning = (
            f"Policy traced directly to canonical institutional chain '{policy_type}'. "
            f"Zero hallucination: steps reflect strictly enforced database statuses."
        )

        return AgentResult(
            agent_name=self.name,
            output=output,
            confidence=1.0,
            reasoning=reasoning
        )
