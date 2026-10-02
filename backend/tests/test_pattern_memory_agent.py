import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.db.models import User, Complaint, Incident
from app.agents.pattern_memory_agent import PatternMemoryAgent
from app.auth.security import hash_password

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # Seed test users
    student = User(name="Test Student", email="student@test.com", password_hash=hash_password("pw"), role="STUDENT")
    admin = User(name="Test Admin", email="admin@test.com", password_hash=hash_password("pw"), role="ADMIN")
    db.add_all([student, admin])
    db.commit()

    yield db
    db.close()

def test_pattern_detection_and_incident_merge(test_db):
    agent = PatternMemoryAgent()
    now = datetime.datetime.utcnow()

    # Add 4 plumbing complaints in Room 302 within past 10 days
    c_ids = []
    for i in range(4):
        c = Complaint(
            student_id=1,
            category="Plumbing",
            title=f"Plumbing issue #{i+1}",
            description="Leaking or choked pipe",
            place="Aryabhatta Hall",
            room="302",
            status="OPEN",
            created_at=now - datetime.timedelta(days=i * 2, minutes=10)
        )
        test_db.add(c)
        test_db.commit()
        test_db.refresh(c)
        c_ids.append(c.id)

    # Run agent
    res = agent.run({
        "db": test_db,
        "place": "Aryabhatta Hall",
        "category": "Plumbing",
        "room": "302"
    })
    out = res.output
    assert out["chronic_count"] == 4
    assert out["is_chronic"] is True
    assert "Room 302" in out["suggested_incident_title"]

    # Merge cluster to confirmed Incident
    incident = PatternMemoryAgent.merge_cluster_to_incident(
        db=test_db,
        complaint_ids=c_ids,
        title=out["suggested_incident_title"],
        category="Plumbing",
        place="Aryabhatta Hall",
        admin_user_id=2,
        description="Merged recurring plumbing tickets for Room 302"
    )

    assert incident.id is not None
    assert incident.title == out["suggested_incident_title"]
    # Check complaints linked to incident
    for cid in c_ids:
        comp = test_db.query(Complaint).filter(Complaint.id == cid).first()
        assert comp.incident_id == incident.id
