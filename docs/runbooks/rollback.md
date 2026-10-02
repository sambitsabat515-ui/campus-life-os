# Runbook: Deployment Rollback

## 1. Trigger Conditions
Initiate rollback immediately if any of the following occur within 15 minutes of deploy:
- Elevated 5xx error rate (>1% over a 5-minute rolling window).
- Health check endpoint `/api/health` reports `unhealthy`.
- Core workflow failure (students cannot submit gate passes or login fails).

## 2. Docker & Container Rollback
If deployed via Docker Compose:
1. Revert to the previously tagged stable release:
   ```bash
   docker-compose down
   # Roll back code checkout
   git checkout HEAD~1
   docker-compose up -d --build
   ```
2. Verify service restoration:
   ```bash
   curl -I http://localhost:8000/api/health
   ```

## 3. Database Migration Reversal
If the deployment included a schema change that introduced an issue:
1. Check current database state:
   ```bash
   python backend/scripts/backup_db.py
   ```
2. Restore the pre-deploy backup from `backend/backups/`:
   ```bash
   cp backend/backups/pre_deploy_backup.db backend/campus_life.db
   ```
3. Restart backend service and verify logs.
