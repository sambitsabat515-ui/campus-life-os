import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.models import User
from app.auth.security import can

client = TestClient(app)

def test_liveness_and_readiness_health_checks():
    """Verify Layer 14: Health checks."""
    live_res = client.get("/api/health/live")
    assert live_res.status_code == 200
    assert live_res.json() == {"status": "alive"}

    ready_res = client.get("/api/health")
    assert ready_res.status_code == 200
    data = ready_res.json()
    assert data["status"] == "healthy"
    assert data["components"]["database"] == "UP"
    assert data["components"]["storage"] == "UP"

def test_security_headers_and_request_id():
    """Verify Layer 10 & 13: Security headers and X-Request-ID propagation."""
    res = client.get("/api/health")
    assert "x-request-id" in res.headers
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["x-frame-options"] == "SAMEORIGIN"
    assert "x-response-time-ms" in res.headers

def test_standard_error_envelope_on_unauthenticated():
    """Verify Layer 5: Standard JSON error envelope."""
    # Attempt to access protected student endpoint without token
    res = client.get("/api/student/dashboard")
    assert res.status_code == 401
    body = res.json()
    assert "error" in body
    assert body["error"]["code"] == "UNAUTHENTICATED"
    assert "request_id" in body["error"]
    assert "message" in body["error"]

def test_standard_error_envelope_on_not_found():
    """Verify Layer 5: Standard JSON error envelope on 404."""
    # Request a non-existent endpoint
    res = client.get("/api/non-existent-endpoint-12345")
    assert res.status_code == 404
    body = res.json()
    assert "error" in body
    assert body["error"]["code"] == "RESOURCE_NOT_FOUND"

def test_central_authorization_can_function():
    """Verify Layer 4: Central can() permission evaluation."""
    student_user = User(id=10, name="Aarav", role="STUDENT")
    staff_user = User(id=20, name="Ramesh", role="STAFF")
    admin_user = User(id=30, name="Dr. Patnaik", role="ADMIN")

    class MockComplaint:
        def __init__(self, student_id):
            self.student_id = student_id

    own_complaint = MockComplaint(student_id=10)
    other_complaint = MockComplaint(student_id=99)

    # Student can view own complaint, but not other's
    assert can(student_user, "view_complaint", own_complaint) is True
    assert can(student_user, "view_complaint", other_complaint) is False

    # Staff can view any complaint
    assert can(staff_user, "view_complaint", other_complaint) is True

    # Only admin can broadcast notices
    assert can(student_user, "broadcast_notice") is False
    assert can(staff_user, "broadcast_notice") is False
    assert can(admin_user, "broadcast_notice") is True
