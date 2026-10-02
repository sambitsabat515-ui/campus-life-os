# Runbook: Database Backup and Disaster Recovery

## 1. Overview
This runbook defines backup schedules, retention periods, integrity verification procedures, and point-in-time recovery for the Campus Life OS database.

## 2. Backup Schedule & Retention
- **Frequency**: Every 6 hours automated snapshot; daily cold archive at 02:00 AM IST.
- **Retention Policy**:
  - Hourly snapshots: Kept for 48 hours.
  - Daily snapshots: Kept for 30 days.
  - Monthly archives: Kept for 1 Academic Year.
- **Location**: Local encrypted partition (`backend/backups/`) and synced to secondary offsite object storage (S3/R2).

## 3. Creating an Online Backup
Run the backup script from the backend directory:
```bash
cd backend
python scripts/backup_db.py
```
This executes an online atomic backup using SQLite's native `sqlite3_backup` API, ensuring zero lockup for active student sessions.

## 4. Disaster Recovery & Restoration Procedure
In the event of database corruption or hardware failure:
1. Stop the application server:
   ```bash
   # If running via systemd or docker
   docker-compose stop backend
   ```
2. Locate the most recent healthy backup in `backend/backups/`:
   ```bash
   ls -lt backend/backups/
   ```
3. Copy the backup file to the target database location:
   ```bash
   cp backend/backups/campus_life_backup_YYYYMMDD_HHMMSS.db backend/campus_life.db
   ```
4. Verify integrity before starting:
   ```bash
   python -c "import sqlite3; conn = sqlite3.connect('backend/campus_life.db'); print(conn.execute('PRAGMA integrity_check;').fetchall())"
   ```
5. Restart the server and verify health check:
   ```bash
   curl http://localhost:8000/api/health
   ```
