import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, Notice
from app.auth.security import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_tokens():
    db = SessionLocal()
    student = db.query(User).filter(User.role == "STUDENT", User.branch == "CSE").first()
    admin = db.query(User).filter(User.role == "ADMIN").first()
    db.close()
    return {
        "student": create_access_token({"sub": str(student.id), "role": student.role, "email": student.email}),
        "admin": create_access_token({"sub": str(admin.id), "role": admin.role, "email": admin.email})
    }

def test_notice_targeting_read_receipt_and_sms_fallback(auth_tokens):
    headers_admin = {"Authorization": f"Bearer {auth_tokens['admin']}"}
    headers_student = {"Authorization": f"Bearer {auth_tokens['student']}"}

    # 1. Admin creates notice targeted to CSE branch
    notice_payload = {
        "title": "CSE Department Industry Hackathon 2026",
        "body": "Teams must submit project abstract before Friday 5 PM.",
        "target_type": "BRANCH",
        "target_value": "CSE",
        "priority": "HIGH"
    }
    create_res = client.post("/api/admin/notices", json=notice_payload, headers=headers_admin)
    assert create_res.status_code == 200
    notice = create_res.json()
    notice_id = notice["id"]

    # 2. Student (CSE) checks notices and receives it
    student_notices_res = client.get("/api/student/notices", headers=headers_student)
    assert student_notices_res.status_code == 200
    notices_list = student_notices_res.json()
    assert any(n["id"] == notice_id for n in notices_list)

    # 3. Student marks notice as read
    read_res = client.post(f"/api/student/notices/{notice_id}/read", headers=headers_student)
    assert read_res.status_code == 200

    # 4. Admin analytics shows read receipt count updated
    analytics_res = client.get("/api/admin/notices/analytics", headers=headers_admin)
    assert analytics_res.status_code == 200
    analytics_items = analytics_res.json()
    target_item = next(it for it in analytics_items if it["id"] == notice_id)
    assert target_item["read_count"] >= 1

    # 5. Admin triggers SMS fallback for unread students
    sms_res = client.post(f"/api/admin/notices/{notice_id}/trigger-sms-fallback", headers=headers_admin)
    assert sms_res.status_code == 200
    assert "SMS fallback broadcast dispatched" in sms_res.json()["message"]
