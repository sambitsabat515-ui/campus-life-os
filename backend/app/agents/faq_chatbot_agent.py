import re
from typing import Dict, Any, List, Optional
from app.agents.base import Agent, AgentResult

FAQ_DATABASE = [
    {
        "id": "faq_library",
        "keywords": ["library", "books", "reading room", "library timing", "book return"],
        "question": "What are the central library working hours and rules?",
        "answer": (
            "The Central Library is open from 08:00 AM to 10:00 PM on all weekdays, and 09:00 AM to 05:00 PM on weekends. "
            "Undergraduate students can issue up to 4 books for 14 days. Late fine is ₹2 per book per day."
        ),
        "category": "Academic Facilities",
        "action_target": "/student/schedule"
    },
    {
        "id": "faq_bonafide",
        "keywords": ["bonafide", "bonafide certificate", "proof of study", "study certificate"],
        "question": "How do I get a Bonafide Certificate?",
        "answer": (
            "You can apply directly via the 'Requests' tab -> 'Certificate Request' -> select 'Bonafide'. "
            "Provide the purpose (passport, education loan, bus pass). Academic section verifies and issues digitally within 24 working hours."
        ),
        "category": "Administrative Services",
        "action_target": "/student/requests"
    },
    {
        "id": "faq_gatepass",
        "keywords": ["gate pass", "out pass", "leave campus", "going home", "night out", "permission to leave"],
        "question": "What is the Gate Pass approval procedure?",
        "answer": (
            "Gate passes must be submitted through the 'Requests' tab with reason, destination, and departure/return times. "
            "Policy requires sequential approval: Faculty Proctor -> Hostel Warden -> Main Gate Security. You will receive an authorization QR code once approved."
        ),
        "category": "Hostel & Security",
        "action_target": "/student/requests"
    },
    {
        "id": "faq_mess_menu",
        "keywords": ["mess menu", "food today", "lunch", "dinner", "breakfast", "what is for lunch", "canteen"],
        "question": "Where can I view today's mess menu or rate food?",
        "answer": (
            "View today's Breakfast, Lunch, Snacks, and Dinner in the 'Hostel' tab under 'Mess & Dining'. "
            "You can also submit 1-5 star ratings and tag quality issues (cold, too salty, delayed) to alert the Mess Committee."
        ),
        "category": "Mess Operations",
        "action_target": "/student/hostel"
    },
    {
        "id": "faq_attendance_rule",
        "keywords": ["attendance", "75", "minimum attendance", "shortage", "condonation", "absent"],
        "question": "What is the mandatory attendance threshold?",
        "answer": (
            "BPUT regulations strictly require a minimum 75% attendance in each registered subject to be eligible for end-semester exams. "
            "Shortages between 65%-74% require medical board endorsement with condonation fee. Check your live attendance under the 'Schedule' tab."
        ),
        "category": "Academic Regulations",
        "action_target": "/student/schedule"
    },
    {
        "id": "faq_hostel_curfew",
        "keywords": ["curfew", "in time", "hostel timing", "late entry", "gate closing"],
        "question": "What are the hostel in-times and curfew rules?",
        "answer": (
            "Hostel gates close at 09:30 PM sharp for all residential blocks. Late entry requires prior biometric log and warden notification. "
            "Unauthorized late entry attracts disciplinary fine and parent intimation."
        ),
        "category": "Hostel Regulations",
        "action_target": "/student/hostel"
    },
    {
        "id": "faq_wifi",
        "keywords": ["wifi", "wi-fi", "internet", "lan", "network password", "mac address"],
        "question": "How do I register my laptop/phone for campus Wi-Fi?",
        "answer": (
            "Register your device MAC address with the Computer Center via the IT Complaint portal. "
            "Hostel Wi-Fi operates on SSID 'BPUT_CAMPUS_NET' using your Roll Number and centralized ERP password."
        ),
        "category": "IT Infrastructure",
        "action_target": "/student/hostel"
    },
    {
        "id": "faq_emergency",
        "keywords": ["medical", "emergency", "ambulance", "doctor", "dispensary", "sick", "hospital"],
        "question": "What is the medical emergency protocol?",
        "answer": (
            "Campus Health Center is open 24x7 near Aryabhatta Hall. For emergency medical transfer, "
            "call the campus ambulance helpline directly at +91-674-2384000 or contact the on-duty hostel security guard immediately."
        ),
        "category": "Emergency & Health",
        "action_target": "/student/hostel"
    },
    {
        "id": "faq_fee_payment",
        "keywords": ["fee", "semester fee", "tuition fee", "payment deadline", "challan", "fine"],
        "question": "How and when do I pay semester fees?",
        "answer": (
            "Semester fees must be paid through SB Collect or the university finance portal before semester registration. "
            "Upload the transaction receipt to the Academic Portal for clearance."
        ),
        "category": "Finance & Accounts",
        "action_target": "/student/requests"
    },
    {
        "id": "faq_migration",
        "keywords": ["migration", "migration certificate", "transfer"],
        "question": "How can I obtain a Migration Certificate?",
        "answer": (
            "Apply in the 'Requests' tab -> 'Certificate Request' -> 'Migration'. "
            "Clearance from Department HOD, Library, Accounts, and Hostel Warden is processed automatically within 3 working days."
        ),
        "category": "Administrative Services",
        "action_target": "/student/requests"
    },
    {
        "id": "faq_transcript",
        "keywords": ["transcript", "official grade sheet", "marks transcript"],
        "question": "How do I apply for an Official Academic Transcript?",
        "answer": (
            "Submit a request under 'Requests' -> 'Certificate Request' -> 'Transcript'. Specify the number of sealed copies and recipient university/institution."
        ),
        "category": "Examinations & Records",
        "action_target": "/student/requests"
    },
    {
        "id": "faq_id_card",
        "keywords": ["id card", "lost card", "identity card", "duplicate card", "badge"],
        "question": "What should I do if I lose my Student ID Card?",
        "answer": (
            "File a lost report at the Security Control Desk, pay the ₹150 duplicate card fee at the Accounts Counter, "
            "and submit the receipt to the Dean of Student Affairs office."
        ),
        "category": "Student Affairs",
        "action_target": "/student/requests"
    },
    {
        "id": "faq_room_change",
        "keywords": ["room change", "change room", "shift room", "roommate change"],
        "question": "Can I request a hostel room change?",
        "answer": (
            "Room shifting is permitted only during the first two weeks of an academic semester. "
            "Submit a written application counter-signed by both roommates to the Chief Warden Office."
        ),
        "category": "Hostel Administration",
        "action_target": "/student/hostel"
    },
    {
        "id": "faq_gym_sports",
        "keywords": ["gym", "gymnasium", "sports", "badminton", "playground", "fitness"],
        "question": "What are the gymnasium and sports complex timings?",
        "answer": (
            "Indoor Gymnasium: 06:00 AM - 08:30 AM (Morning) & 05:00 PM - 08:30 PM (Evening). "
            "Sports kits for cricket, badminton, and football are issued at the Student Activity Center with your ID card."
        ),
        "category": "Sports & Recreation",
        "action_target": "/student/home"
    },
    {
        "id": "faq_bus_shuttle",
        "keywords": ["bus", "shuttle", "transport", "pickup", "city bus"],
        "question": "What is the campus bus and shuttle schedule?",
        "answer": (
            "Campus shuttles run every 30 minutes between Main Gate, Academic Blocks, and Outer Hostels from 08:00 AM to 06:00 PM. "
            "City buses depart at 07:30 AM and return at 05:30 PM."
        ),
        "category": "Campus Transport",
        "action_target": "/student/home"
    },
    {
        "id": "faq_scholarship",
        "keywords": ["scholarship", "prerana", "fee waiver", "financial aid", "nsp"],
        "question": "Where do I submit state/central scholarship verification?",
        "answer": (
            "Submit your scholarship documents (PRERANA, Medhabruti, NSP) at Academic Counter #3 between 02:00 PM and 04:30 PM on Tuesdays and Thursdays."
        ),
        "category": "Scholarships & Aid",
        "action_target": "/student/requests"
    },
    {
        "id": "faq_placement",
        "keywords": ["placement", "tpo", "training", "internship", "campus recruitment", "interview"],
        "question": "How do I register with the Training & Placement Cell (T&P)?",
        "answer": (
            "Final and pre-final year students must register on the T&P portal with verified CGPA and resume before August 15. "
            "The T&P office is located on the 2nd Floor, Administrative Block."
        ),
        "category": "Training & Placement",
        "action_target": "/student/profile"
    },
    {
        "id": "faq_anti_ragging",
        "keywords": ["ragging", "anti ragging", "harassment", "bully", "helpline"],
        "question": "What is the Anti-Ragging helpline and policy?",
        "answer": (
            "The campus enforces zero tolerance for ragging. Toll-free national helpline: 1800-180-5522. "
            "Campus Anti-Ragging Squad mobile: +91-94370-12345. Confidential complaints can be dropped in the Proctorial Box."
        ),
        "category": "Campus Discipline & Safety",
        "action_target": "/student/home"
    },
    {
        "id": "faq_lost_found",
        "keywords": ["lost and found", "lost item", "found phone", "lost wallet"],
        "question": "Where is the Campus Lost and Found desk located?",
        "answer": (
            "Lost and found items are deposited with the Central Security Office at Main Gate #1. "
            "Items can be claimed upon providing proof of ownership and signing the property register."
        ),
        "category": "Security Services",
        "action_target": "/student/home"
    },
    {
        "id": "faq_dsw_office",
        "keywords": ["dsw", "dean student welfare", "student affairs office", "dsw timing"],
        "question": "When can I meet the Dean of Student Welfare (DSW)?",
        "answer": (
            "The DSW office is open for student grievances Monday through Friday from 03:30 PM to 05:30 PM in Room 108, Administrative Block."
        ),
        "category": "Administration",
        "action_target": "/student/home"
    }
]

FALLBACK_MESSAGE = (
    "I cannot answer that directly from standard campus FAQ records. "
    "To avoid guessing or incorrect information, please raise this as an official request "
    "under the 'Requests' or 'Hostel' tab, or consult the Administrative Block."
)

class FAQChatbotAgent(Agent):
    name = "FAQChatbotAgent"

    def run(self, input_data: dict) -> AgentResult:
        query = input_data.get("query", "").strip()
        query_lower = query.lower()

        best_faq = None
        best_score = 0

        for item in FAQ_DATABASE:
            score = 0
            for kw in item["keywords"]:
                pattern = r'\b' + re.escape(kw) + r'\b'
                if re.search(pattern, query_lower):
                    score += 2
                elif kw in query_lower:
                    score += 1

            if score > best_score:
                best_score = score
                best_faq = item

        if best_faq and best_score >= 1:
            confidence = min(0.98, 0.65 + best_score * 0.1)
            output = {
                "matched": True,
                "faq_id": best_faq["id"],
                "category": best_faq["category"],
                "question": best_faq["question"],
                "answer": best_faq["answer"],
                "action_target": best_faq["action_target"]
            }
            reasoning = f"Deterministic match with FAQ topic '{best_faq['question']}' (score={best_score})."
            return AgentResult(agent_name=self.name, output=output, confidence=confidence, reasoning=reasoning)

        # Fallback
        output = {
            "matched": False,
            "faq_id": None,
            "category": "Unknown",
            "question": query,
            "answer": FALLBACK_MESSAGE,
            "action_target": "/student/requests"
        }
        reasoning = "Query did not hit any canonical FAQ keyword rules. Falling back safely to official request routing."
        return AgentResult(agent_name=self.name, output=output, confidence=0.20, reasoning=reasoning)
