import datetime
import json
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, Base, engine
from app.db.models import (
    User, Complaint, ComplaintAuditTrail, GatePass, CertificateRequest,
    Attendance, ScheduleSlot, Notice, NoticeReadReceipt, MessHall,
    MessMenuItem, MessFeedback, CampusMap, MapPin
)
from app.auth.security import hash_password

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("Database already seeded. Skipping initial data load.")
        db.close()
        return

    print("Seeding BPUT Campus Life OS database...")

    # 1. USERS
    student1 = User(
        name="Aarav Sharma",
        email="student@campus.edu",
        password_hash=hash_password("student123"),
        role="STUDENT",
        roll_no="220101045",
        branch="CSE",
        year=3,
        hostel="Aryabhatta Hall",
        room="302",
        phone="+919876543210",
        preferred_language="en"
    )
    student2 = User(
        name="Sneha Mohanty",
        email="student2@campus.edu",
        password_hash=hash_password("student123"),
        role="STUDENT",
        roll_no="220101099",
        branch="CSE",
        year=3,
        hostel="Gargi Hall",
        room="204",
        phone="+919876543211",
        preferred_language="or"
    )
    student3 = User(
        name="Rohan Das",
        email="student3@campus.edu",
        password_hash=hash_password("student123"),
        role="STUDENT",
        roll_no="230102012",
        branch="ECE",
        year=2,
        hostel="Aryabhatta Hall",
        room="302",
        phone="+919876543212",
        preferred_language="hi"
    )

    warden = User(
        name="Dr. K. C. Pradhan",
        email="warden@campus.edu",
        password_hash=hash_password("warden123"),
        role="STAFF",
        hostel="Aryabhatta Hall",
        phone="+919876543220",
        preferred_language="en"
    )
    faculty = User(
        name="Prof. S. N. Jena",
        email="faculty@campus.edu",
        password_hash=hash_password("faculty123"),
        role="STAFF",
        branch="CSE",
        phone="+919876543221",
        preferred_language="en"
    )

    admin = User(
        name="Dr. B. K. Mishra (Dean Admin)",
        email="admin@campus.edu",
        password_hash=hash_password("admin123"),
        role="ADMIN",
        phone="+919876543230",
        preferred_language="en"
    )

    mess_mgr = User(
        name="Ramesh Nayak (Mess In-Charge)",
        email="mess@campus.edu",
        password_hash=hash_password("mess123"),
        role="MESS",
        phone="+919876543240",
        preferred_language="en"
    )

    db.add_all([student1, student2, student3, warden, faculty, admin, mess_mgr])
    db.commit()

    # 2. MESS HALLS & MENUS
    mess1 = MessHall(name="Aryabhatta Boys Mess", hostel_id="Aryabhatta Hall")
    mess2 = MessHall(name="Gargi Girls Dining Hall", hostel_id="Gargi Hall")
    db.add_all([mess1, mess2])
    db.commit()

    today = datetime.date.today()
    m1 = MessMenuItem(mess_hall_id=mess1.id, date=today, meal_type="BREAKFAST", name="Idli, Sambar, Coconut Chutney & Boiled Egg")
    m2 = MessMenuItem(mess_hall_id=mess1.id, date=today, meal_type="LUNCH", name="Steamed Rice, Dalma (Odisha Special), Paneer Curry, Salad & Papad")
    m3 = MessMenuItem(mess_hall_id=mess1.id, date=today, meal_type="SNACKS", name="Aloo Chop & Masala Milk Tea")
    m4 = MessMenuItem(mess_hall_id=mess1.id, date=today, meal_type="DINNER", name="Tawa Roti, Chicken Kassa / Matar Paneer, Dal Fry & Kheer")

    db.add_all([m1, m2, m3, m4])
    db.commit()

    fb1 = MessFeedback(
        student_id=student1.id,
        menu_item_id=m2.id,
        rating=2,
        tags=json.dumps(["cold", "too_salty"]),
        comment="Dalma was served completely cold today and had excess salt. Please fix warming pans."
    )
    fb2 = MessFeedback(
        student_id=student2.id,
        menu_item_id=m2.id,
        rating=5,
        tags=json.dumps(["delicious", "fresh"]),
        comment="Paneer curry was very tasty and fresh!"
    )
    db.add_all([fb1, fb2])
    db.commit()

    # 3. COMPLAINTS & AGEING SIMULATION (Problem Statement 07 narrative)
    now = datetime.datetime.utcnow()
    # Ageing complaint > 72 hours (9 days leaking tap!)
    c1 = Complaint(
        student_id=student1.id,
        category="Plumbing",
        title="Leaking bathroom washbasin tap going on for 9 days",
        description="Washbasin faucet in room washroom has been leaking constantly day and night. Water is accumulating on the tiles.",
        place="Aryabhatta Hall",
        room="302",
        floor="3rd Floor",
        priority="HIGH",
        status="OPEN",
        assigned_to=warden.id,
        created_at=now - datetime.timedelta(days=9)
    )
    # Ageing complaint > 48 hours
    c2 = Complaint(
        student_id=student1.id,
        category="Electrical",
        title="Ceiling fan regulator burnt out - only runs at speed 5",
        description="Speed controller sparking when turned and stuck at full speed. Risk of short circuit.",
        place="Aryabhatta Hall",
        room="302",
        floor="3rd Floor",
        priority="HIGH",
        status="ASSIGNED",
        assigned_to=warden.id,
        created_at=now - datetime.timedelta(hours=54)
    )
    # Ageing complaint > 24 hours
    c3 = Complaint(
        student_id=student3.id,
        category="Plumbing",
        title="Shower pipe valve broken - no cold water",
        description="Hot water only coming through mixer valve, cold water valve jammed shut.",
        place="Aryabhatta Hall",
        room="302",
        floor="3rd Floor",
        priority="MEDIUM",
        status="IN_PROGRESS",
        assigned_to=warden.id,
        created_at=now - datetime.timedelta(hours=30)
    )
    # 4th complaint in room 302 within 30 days -> Triggers CHRONIC RECURRING pattern!
    c4 = Complaint(
        student_id=student1.id,
        category="Plumbing",
        title="Toilet flush tank leaking continuously into pan",
        description="Ballcock valve not shutting off water inlet. Massive water wastage.",
        place="Aryabhatta Hall",
        room="302",
        floor="3rd Floor",
        priority="HIGH",
        status="OPEN",
        created_at=now - datetime.timedelta(days=4)
    )
    # Recent spike complaint in Aryabhatta Hall within last 1 hour
    c5 = Complaint(
        student_id=student3.id,
        category="Plumbing",
        title="Corridor main washroom line overflow",
        description="Water backing up into 3rd floor corridor outside room 305.",
        place="Aryabhatta Hall",
        room="305",
        floor="3rd Floor",
        priority="CRITICAL",
        status="OPEN",
        created_at=now - datetime.timedelta(minutes=45)
    )

    db.add_all([c1, c2, c3, c4, c5])
    db.commit()

    # Audit trail for c2
    a1 = ComplaintAuditTrail(
        complaint_id=c2.id,
        action="STATUS_CHANGED",
        performed_by=warden.id,
        previous_status="OPEN",
        new_status="ASSIGNED",
        note="Assigned to Electrical maintenance team. Work order #E-409 generated.",
        timestamp=now - datetime.timedelta(hours=48)
    )
    db.add(a1)
    db.commit()

    # 4. GATE PASSES WITH APPROVER CHAIN
    approver_chain = [
        {"step": 1, "role": "faculty", "name": "Prof. S. N. Jena", "status": "APPROVED", "timestamp": (now - datetime.timedelta(hours=4)).isoformat(), "note": "Academic attendance verified (78%)"},
        {"step": 2, "role": "warden", "name": "Dr. K. C. Pradhan", "status": "PENDING", "timestamp": None, "note": "Awaiting hostel register verification"},
        {"step": 3, "role": "gate", "name": "Main Gate Security", "status": "PENDING", "timestamp": None, "note": "Pending departure verification"}
    ]
    gp1 = GatePass(
        student_id=student1.id,
        reason="Attending cousin's wedding ceremony and medical checkup",
        destination="Cuttack (Home)",
        departure_time=now + datetime.timedelta(days=1, hours=2),
        expected_return=now + datetime.timedelta(days=3, hours=6),
        approver_chain=json.dumps(approver_chain),
        status="PENDING",
        created_at=now - datetime.timedelta(hours=5)
    )
    db.add(gp1)
    db.commit()

    # 5. CERTIFICATE REQUESTS
    cert1 = CertificateRequest(
        student_id=student1.id,
        type="BONAFIDE",
        purpose="Application for Passport renewal at Regional Passport Office, Bhubaneswar",
        status="PROCESSING",
        requested_at=now - datetime.timedelta(days=1, hours=4)
    )
    cert2 = CertificateRequest(
        student_id=student1.id,
        type="TRANSCRIPT",
        purpose="Application for Summer Research Internship at IIT Kharagpur",
        status="READY",
        requested_at=now - datetime.timedelta(days=3),
        ready_at=now - datetime.timedelta(hours=6)
    )
    db.add_all([cert1, cert2])
    db.commit()

    # 6. SCHEDULE & ATTENDANCE
    slots = [
        ScheduleSlot(course_id="CS301", course_name="Database Management Systems", day_of_week="Monday", start_time="09:00", end_time="10:00", room="LH-101", instructor_name="Prof. S. N. Jena", batch="CSE-2023"),
        ScheduleSlot(course_id="CS302", course_name="Computer Networks", day_of_week="Monday", start_time="10:15", end_time="11:15", room="LH-102", instructor_name="Dr. P. Panda", batch="CSE-2023"),
        ScheduleSlot(course_id="CS303", course_name="Operating Systems", day_of_week="Monday", start_time="11:30", end_time="12:30", room="LH-101", instructor_name="Prof. A. Ray", batch="CSE-2023"),
        ScheduleSlot(course_id="CS304", course_name="Design & Analysis of Algorithms", day_of_week="Monday", start_time="02:00", end_time="04:00", room="Lab-3", instructor_name="Dr. R. K. Behera", batch="CSE-2023"),
        ScheduleSlot(course_id="CS301", course_name="Database Management Systems", day_of_week="Tuesday", start_time="09:00", end_time="10:00", room="LH-101", instructor_name="Prof. S. N. Jena", batch="CSE-2023"),
        ScheduleSlot(course_id="CS302", course_name="Computer Networks", day_of_week="Tuesday", start_time="10:15", end_time="11:15", room="LH-102", instructor_name="Dr. P. Panda", batch="CSE-2023"),
    ]
    db.add_all(slots)
    db.commit()

    # Attendance logs (CS302 will be under 75% threshold!)
    # CS301 (DBMS): 9/10 = 90%
    for i in range(10):
        d = today - datetime.timedelta(days=i+1)
        st = "PRESENT" if i != 2 else "ABSENT"
        db.add(Attendance(course_id="CS301", student_id=student1.id, session_date=d, status=st, marked_by=faculty.id))

    # CS302 (Networks): 6/10 = 60% (Under 75% BPUT threshold!)
    for i in range(10):
        d = today - datetime.timedelta(days=i+1)
        st = "PRESENT" if i in [0, 1, 3, 5, 7, 9] else "ABSENT"
        db.add(Attendance(course_id="CS302", student_id=student1.id, session_date=d, status=st, marked_by=faculty.id))

    # CS303 (OS): 8/10 = 80%
    for i in range(10):
        d = today - datetime.timedelta(days=i+1)
        st = "PRESENT" if i not in [4, 8] else "ABSENT"
        db.add(Attendance(course_id="CS303", student_id=student1.id, session_date=d, status=st, marked_by=faculty.id))

    db.commit()

    # 7. NOTICES & TARGETING
    n1 = Notice(
        title="Mid-Semester Examination Schedule Announced",
        body="Mid-Semester examinations for 3rd and 5th semester B.Tech commence from October 15. Admit cards must be collected from department office.",
        author_id=admin.id,
        target_type="YEAR",
        target_value="3",
        priority="URGENT",
        created_at=now - datetime.timedelta(hours=18)
    )
    n2 = Notice(
        title="Hostel Wi-Fi Upgradation & Scheduled Downtime",
        body="BPUT Central IT will carry out fiber backbone maintenance in Aryabhatta Hall this Saturday between 02:00 AM and 05:00 AM.",
        author_id=admin.id,
        target_type="HOSTEL",
        target_value="Aryabhatta Hall",
        priority="NORMAL",
        created_at=now - datetime.timedelta(hours=36)
    )
    n3 = Notice(
        title="Mandatory Attendance Warning: 75% BPUT Policy",
        body="Students having attendance lower than 75% are immediately barred from appearing in practical evaluations without medical clearance.",
        author_id=admin.id,
        target_type="ALL",
        target_value="ALL",
        priority="CRITICAL",
        created_at=now - datetime.timedelta(days=2)
    )
    db.add_all([n1, n2, n3])
    db.commit()

    # Read receipt for student1 on n1
    rr1 = NoticeReadReceipt(notice_id=n1.id, student_id=student1.id, read_at=now - datetime.timedelta(hours=2), acknowledged_at=now - datetime.timedelta(hours=2))
    db.add(rr1)
    db.commit()

    # 8. CAMPUS MAP & PINS (Section 12)
    cmap = CampusMap(
        glb_path="/models/campus_prototype.glb",
        uploaded_by=admin.id,
        uploaded_at=now,
        is_active=True
    )
    db.add(cmap)
    db.commit()

    pins = [
        MapPin(campus_map_id=cmap.id, label="Administrative Block", description="Dean Offices, Accounts, Bonafide/Transcript Counter #2", x=-5.0, y=0.5, z=2.0),
        MapPin(campus_map_id=cmap.id, label="Academic Block (CSE/ECE)", description="Lecture Halls LH-101 to LH-106 & Computer Labs", x=6.0, y=0.5, z=-3.0),
        MapPin(campus_map_id=cmap.id, label="Central Library", description="Reading Rooms, Digital Library, Book Issue Counter", x=3.0, y=0.5, z=1.0),
        MapPin(campus_map_id=cmap.id, label="Aryabhatta Boys Hostel", description="Residential Block A & B, Warden Office", x=-8.0, y=0.5, z=-7.0),
        MapPin(campus_map_id=cmap.id, label="Gargi Girls Hostel", description="Residential Block G1 & G2", x=-12.0, y=0.5, z=-2.0),
        MapPin(campus_map_id=cmap.id, label="Central Mess Hall", description="Mess Dining, Catering Kitchen", x=-6.0, y=0.5, z=-8.0),
        MapPin(campus_map_id=cmap.id, label="Main Campus Gate", description="Gate Pass Security Scanner, Bus Shuttle Stop", x=0.0, y=0.5, z=10.0),
    ]
    db.add_all(pins)
    db.commit()

    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
