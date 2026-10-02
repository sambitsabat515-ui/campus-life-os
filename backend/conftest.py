import sys
from pathlib import Path

# Add backend directory to sys.path so 'app' is cleanly discoverable
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Ensure database tables and seed data exist for all tests
from app.db.session import engine, Base
from app.db.seed import seed_database

Base.metadata.create_all(bind=engine)
seed_database()
