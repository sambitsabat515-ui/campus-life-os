# Threat Model & OWASP Top 10 Mitigation Matrix

## 1. Asset Inventory
- **Student PII**: Full name, roll number, hostel room, phone number, attendance records.
- **Access Credentials**: Passwords (salted hashes), JWT tokens, active sessions.
- **Physical Security Tokens**: Gate pass QR codes, departure timestamps, guard verification signatures.
- **Operational Infrastructure**: Database (`campus_life.db`), uploaded files (`backend/uploads/`).

## 2. Threat Analysis & Mitigations

| Threat Vector | Attack Scenario | Impact | Mitigation in Campus Life OS |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | Student changes URL ID to view or cancel another student's gate pass or complaint. | Critical | Enforced via central `can(user, action, resource)` and `authorize()` checks. Returns 404 on cross-student resource queries to eliminate IDOR. |
| **A02: Cryptographic Failures** | Plaintext password leaks or weak JWT signing keys. | Critical | Salted password hashing, HMAC-SHA256 JWT tokens with 24-hour expiration, `.env.example` preventing committed keys. |
| **A03: Injection** | SQL injection in complaint search or text inputs. | High | 100% parameterized queries via SQLAlchemy ORM. Zero raw string concatenation. |
| **A04: Insecure Design** | Falsifying gate pass approval by copying another student's QR code. | High | Dynamic QR payload containing cryptographic pass ID, student ID, valid departure window, and live server signature verification. |
| **A05: Security Misconfiguration** | Verbose error stack traces leaking server internals. | Medium | Global exception handler formatting all errors into standard envelope (`{"error": {"code": ...}}`). |
| **A06: Vulnerable Components** | Outdated NPM or Python dependencies. | Medium | Pinned versions in `requirements.txt` and `package.json`, automated Dependabot CI checks. |
| **A07: Identification & Auth Failures** | Brute force password guessing on student accounts. | High | Rate limiting middleware capping failed login attempts per IP and per account. |
| **A08: Software & Data Integrity** | Tampering with notice contents during transit. | High | Server-side notice author verification, tamper-resistant read receipt tracking. |
| **A09: Security Logging & Monitoring** | Breaches going unnoticed without audit trail. | Medium | Structured logging with `request_id`, automated PII redaction for passwords and tokens. |
| **A10: Server-Side Request Forgery** | Malicious avatar URL causing backend to fetch internal metadata. | Medium | File uploads saved strictly to local validated directory; no arbitrary server fetch. |
