import datetime
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, GatePass, ScheduleSlot, Attendance
from app.auth.security import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_tokens():
    db = SessionLocal()
    student = db.query(User).filter(User.role == "STUDENT").first()
    staff = db.query(User).filter(User.role == "STAFF").first()
    admin = db.query(User).filter(User.role == "ADMIN").first()
    db.close()
    return {
        "student": create_access_token({"sub": str(student.id), "role": student.role, "email": student.email}),
        "staff": create_access_token({"sub": str(staff.id), "role": staff.role, "email": staff.email}),
        "admin": create_access_token({"sub": str(admin.id), "role": admin.role, "email": admin.email})
    }

def test_timetable_crud_and_staff_workload(auth_tokens):
    headers_staff = {"Authorization": f"Bearer {auth_tokens['staff']}"}
    headers_admin = {"Authorization": f"Bearer {auth_tokens['admin']}"}

    # Ensure clean state
    db = SessionLocal()
    db.query(ScheduleSlot).filter(ScheduleSlot.course_id == "CS401").delete()
    db.commit()
    db.close()

    # 1. Create a timetable slot
    slot_payload = {
        "course_id": "CS401",
        "course_name": "Distributed Systems",
        "day_of_week": "Friday",
        "start_time": "16:00",
        "end_time": "17:00",
        "room": "LH-9",
        "instructor_name": "Prof. R. Mishra",
        "batch": "CSE-2023"
    }
    create_res = client.post("/api/timetable/slots", json=slot_payload, headers=headers_staff)
    assert create_res.status_code == 200
    slot = create_res.json()
    slot_id = slot["id"]
    assert slot["course_id"] == "CS401"

    # 2. List slots
    list_res = client.get("/api/timetable/slots?day=Friday", headers=headers_staff)
    assert list_res.status_code == 200
    slots = list_res.json()
    assert any(s["id"] == slot_id for s in slots)

    # 3. Admin checks staff workload
    workload_res = client.get("/api/timetable/staff-workload", headers=headers_admin)
    assert workload_res.status_code == 200
    workload = workload_res.json()
    assert any(w["instructor"] == "Prof. R. Mishra" for w in workload)

    # 4. Admin reassigns slot to another teacher
    reassign_res = client.put(f"/api/timetable/slots/{slot_id}/reassign", json={"instructor_name": "Dr. A. K. Behera"}, headers=headers_admin)
    assert reassign_res.status_code == 200
    assert reassign_res.json()["instructor_name"] == "Dr. A. K. Behera"

    # 5. Delete slot
    del_res = client.delete(f"/api/timetable/slots/{slot_id}", headers=headers_staff)
    assert del_res.status_code == 200

def test_attendance_check_and_bulk_submission(auth_tokens):
    headers_staff = {"Authorization": f"Bearer {auth_tokens['staff']}"}
    today_str = datetime.date.today().isoformat()

    # 1. Fetch students for staff
    st_res = client.get("/api/staff/students", headers=headers_staff)
    assert st_res.status_code == 200
    students = st_res.json()
    assert len(students) > 0
    test_student = students[0]

    # 2. Check if attendance already committed for dummy date
    check_res = client.get(f"/api/staff/attendance/check?course_id=CS301&session_date={today_str}", headers=headers_staff)
    assert check_res.status_code == 200

    # 3. Commit attendance with P/A switch map
    att_payload = {
        "course_id": "CS301",
        "session_date": today_str,
        "attendances": [
            {"student_id": test_student["id"], "status": "PRESENT"}
        ]
    }
    commit_res = client.post("/api/staff/attendance/bulk", json=att_payload, headers=headers_staff)
    assert commit_res.status_code == 200
    assert commit_res.json()["status"] == "success"

    # 4. Re-check: now committed should be True
    check_res2 = client.get(f"/api/staff/attendance/check?course_id=CS301&session_date={today_str}", headers=headers_staff)
    assert check_res2.status_code == 200
    assert check_res2.json()["committed"] is True

def test_gatepass_queue_escalation(auth_tokens):
    headers_student = {"Authorization": f"Bearer {auth_tokens['student']}"}
    headers_staff = {"Authorization": f"Bearer {auth_tokens['staff']}"}
    headers_admin = {"Authorization": f"Bearer {auth_tokens['admin']}"}

    dep_time = datetime.datetime.utcnow() + datetime.timedelta(days=1)
    ret_time = datetime.datetime.utcnow() + datetime.timedelta(days=2)

    # 1. Student requests gate pass
    gp_res = client.post("/api/student/requests/gatepass", json={
        "reason": "Conference presentation in Cuttack",
        "destination": "Cuttack",
        "departure_time": dep_time.isoformat(),
        "expected_return": ret_time.isoformat()
    }, headers=headers_student)
    assert gp_res.status_code == 200
    gp_id = gp_res.json()["id"]

    # 2. Staff queue lists it
    queue_res = client.get("/api/staff/gatepass/queue", headers=headers_staff)
    assert queue_res.status_code == 200
    assert any(p["id"] == gp_id for p in queue_res.json())

    # 3. Escalate to HOD
    esc_res = client.post(f"/api/staff/gatepass/{gp_id}/escalate", headers=headers_staff)
    assert esc_res.status_code == 200
    assert esc_res.json()["escalated_to"] == "HOD"

    # 4. Escalate to Admin
    esc_res2 = client.post(f"/api/staff/gatepass/{gp_id}/escalate", headers=headers_staff)
    assert esc_res2.status_code == 200
    assert esc_res2.json()["escalated_to"] == "ADMIN"

    # 5. Admin approves escalated gate pass
    admin_act_res = client.post(f"/api/admin/gatepass/{gp_id}/action", json={"action": "APPROVE", "note": "Dean approved"}, headers=headers_admin)
    assert admin_act_res.status_code == 200
    assert admin_act_res.json()["new_status"] == "APPROVED"

def test_data_migration_import_students(auth_tokens):
    headers_admin = {"Authorization": f"Bearer {auth_tokens['admin']}"}
    headers_staff = {"Authorization": f"Bearer {auth_tokens['staff']}"}

    sample_students = [
        {
            "name": "Tanmay Panda",
            "roll_no": "2201CS999",
            "branch": "CSE",
            "hostel_room": "Aryabhatta-408",
            "phone": "9861000999"
        }
    ]

    # 1. Admin imports students
    import_res = client.post("/api/admin/migration/import-students", json={"students": sample_students}, headers=headers_admin)
    assert import_res.status_code == 200
    res_data = import_res.json()
    assert res_data["status"] == "success"

    # 2. Staff views students list and finds newly imported student
    st_res = client.get("/api/staff/students", headers=headers_staff)
    assert st_res.status_code == 200
    students = st_res.json()
    matched = [s for s in students if s["roll_no"] == "2201CS999"]
    assert len(matched) == 1
    assert matched[0]["name"] == "Tanmay Panda"
    assert matched[0]["hostel"] == "Aryabhatta Hall"
    assert matched[0]["room"] == "408"
