# Runbook: Incident Response & Post-Mortem Template

## 1. Incident Severity Levels
- **SEV-1 (Critical)**: Platform completely down, security breach, or gate pass verification system offline during curfew departure hours.
- **SEV-2 (Major)**: Specific module failure (e.g. notices not sending, voice agent unavailable), core operations intact.
- **SEV-3 (Minor)**: Cosmetic UI issue or minor latency degradation.

## 2. Immediate Response Protocol (SEV-1)
1. **Acknowledge & Declare**: Post notification in admin control room and switch frontend to maintenance or low-bandwidth offline mode.
2. **Triage**: Check recent logs with request IDs:
   ```bash
   tail -n 100 backend/app.log
   ```
3. **Execute Mitigation**: Run rollback (`docs/runbooks/rollback.md`) or restore database (`docs/runbooks/backups.md`).
4. **Communicate**: Send emergency SMS broadcast to wardens and gate security.

## 3. Post-Incident Review Template
- **Incident Summary**: What happened, start time, end time, duration.
- **Impact**: Number of students/staff affected, failed requests.
- **Root Cause**: The underlying technical failure (5 Whys analysis).
- **Corrective Actions**: Preventative fixes committed to codebase with accompanying test cases.
