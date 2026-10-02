import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import Complaint, User
from app.auth.security import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_tokens():
    db = SessionLocal()
    student = db.query(User).filter(User.role == "STUDENT").first()
    staff = db.query(User).filter(User.role == "STAFF").first()
    admin = db.query(User).filter(User.role == "ADMIN").first()

    student_token = create_access_token({"sub": str(student.id), "role": student.role, "email": student.email})
    staff_token = create_access_token({"sub": str(staff.id), "role": staff.role, "email": staff.email})
    admin_token = create_access_token({"sub": str(admin.id), "role": admin.role, "email": admin.email})

    db.close()
    return {
        "student": student_token,
        "staff": staff_token,
        "admin": admin_token
    }

def test_complaint_lifecycle_end_to_end(auth_tokens):
    # 1. Student creates a complaint
    headers_student = {"Authorization": f"Bearer {auth_tokens['student']}"}
    create_payload = {
        "category": "Plumbing",
        "title": "Severe bathroom pipe burst",
        "description": "Pipe joint broke and water is flooding washroom",
        "place": "Aryabhatta Hall",
        "room": "302",
        "floor": "3rd Floor"
    }
    res = client.post("/api/student/complaints", json=create_payload, headers=headers_student)
    assert res.status_code == 200
    comp_data = res.json()
    complaint_id = comp_data["id"]
    assert comp_data["status"] == "OPEN"
    assert comp_data["priority"] in ["HIGH", "CRITICAL"]

    # 2. Staff views assigned ticket queue and transitions status to IN_PROGRESS
    headers_staff = {"Authorization": f"Bearer {auth_tokens['staff']}"}
    queue_res = client.get("/api/staff/tickets", headers=headers_staff)
    assert queue_res.status_code == 200
    assert any(t["id"] == complaint_id for t in queue_res.json())

    update_res = client.put(
        f"/api/staff/tickets/{complaint_id}/status",
        json={"status": "IN_PROGRESS", "note": "Plumber dispatched with spare pipe fittings"},
        headers=headers_staff
    )
    assert update_res.status_code == 200
    assert update_res.json()["new_status"] == "IN_PROGRESS"

    # 3. Staff resolves complaint with notes
    resolve_res = client.put(
        f"/api/staff/tickets/{complaint_id}/status",
        json={"status": "RESOLVED", "note": "New PVC pipe valve fitted and tested under full pressure."},
        headers=headers_staff
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["new_status"] == "RESOLVED"

    # 4. Admin analytics reflects the complaint and resolution
    headers_admin = {"Authorization": f"Bearer {auth_tokens['admin']}"}
    analytics_res = client.get("/api/admin/dashboard/analytics", headers=headers_admin)
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert "ageing_heatmap" in analytics
    assert "resolution_trends" in analytics
    assert "Plumbing" in analytics["by_category"] or "Plumbing" in analytics["resolution_trends"]
