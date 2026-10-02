import datetime
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, GatePass
from app.auth.security import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_tokens():
    db = SessionLocal()
    student = db.query(User).filter(User.role == "STUDENT").first()
    staff = db.query(User).filter(User.role == "STAFF").first()
    db.close()
    return {
        "student": create_access_token({"sub": str(student.id), "role": student.role, "email": student.email}),
        "staff": create_access_token({"sub": str(staff.id), "role": staff.role, "email": staff.email})
    }

def test_gatepass_approval_flow(auth_tokens):
    headers_student = {"Authorization": f"Bearer {auth_tokens['student']}"}
    headers_staff = {"Authorization": f"Bearer {auth_tokens['staff']}"}

    dep_time = datetime.datetime.utcnow() + datetime.timedelta(days=1)
    ret_time = datetime.datetime.utcnow() + datetime.timedelta(days=3)

    # 1. Student requests gate pass
    req_payload = {
        "reason": "Family function in Bhubaneswar",
        "destination": "Bhubaneswar",
        "departure_time": dep_time.isoformat(),
        "expected_return": ret_time.isoformat()
    }
    create_res = client.post("/api/student/requests/gatepass", json=req_payload, headers=headers_student)
    assert create_res.status_code == 200
    gp = create_res.json()
    gp_id = gp["id"]
    assert gp["status"] == "PENDING"
    assert len(gp["approver_chain"]) > 0
    # Step 1 should be student submission (completed)
    assert gp["approver_chain"][0]["status"] == "COMPLETED"

    # 2. Staff acts on gate pass (approves step)
    action_payload = {"action": "APPROVE", "note": "Proctor attendance check cleared"}
    act_res = client.post(f"/api/staff/gatepass/{gp_id}/action", json=action_payload, headers=headers_staff)
    assert act_res.status_code == 200

    # 3. Student views updated live tracker
    list_res = client.get("/api/student/requests/gatepass", headers=headers_student)
    assert list_res.status_code == 200
    passes = list_res.json()
    my_pass = next(p for p in passes if p["id"] == gp_id)
    # Check that faculty step is approved
    step2 = my_pass["approver_chain"][1]
    assert step2["status"] == "APPROVED"
