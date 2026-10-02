import os
import shutil
import sqlite3
import datetime
import sys

def backup_database():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "campus_life.db")
    backup_dir = os.path.join(base_dir, "backups")
    os.makedirs(backup_dir, exist_ok=True)

    if not os.path.exists(db_path):
        print(f"Error: Database file {db_path} does not exist.")
        sys.exit(1)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(backup_dir, f"campus_life_backup_{timestamp}.db")

    # Use SQLite native backup API for atomic, online, consistent snapshot
    print(f"Starting online atomic backup of {db_path}...")
    source_conn = sqlite3.connect(db_path)
    dest_conn = sqlite3.connect(backup_path)

    try:
        source_conn.backup(dest_conn)
        print(f"Backup completed successfully: {backup_path}")
        file_size = os.path.getsize(backup_path)
        print(f"Backup file size: {file_size / 1024:.2f} KB")

        # Test verification: verify integrity of the backup file
        dest_cursor = dest_conn.cursor()
        dest_cursor.execute("PRAGMA integrity_check;")
        check_result = dest_cursor.fetchone()
        if check_result and check_result[0] == "ok":
            print("Backup integrity verified: PRAGMA integrity_check = OK")
            return backup_path
        else:
            print(f"Integrity check failed: {check_result}")
            sys.exit(1)
    finally:
        source_conn.close()
        dest_conn.close()

if __name__ == "__main__":
    backup_database()
