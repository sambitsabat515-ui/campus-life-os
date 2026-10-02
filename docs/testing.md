# Testing Strategy & Test Suite Specification

## 1. Overview
The testing architecture enforces quality across three distinct tiers: Unit Tests, Integration Tests, and End-to-End Workflow Tests.

## 2. Testing Levels
- **Tier 1: Unit Tests (Pure Functions & Deterministic Agents)**
  - `test_complaint_routing_agent.py`: Keyword tokenization, department matrix accuracy, urgent keyword score bumps.
  - `test_pattern_memory_agent.py`: Temporal sliding window, recurring ticket grouping, automated incident generation.
  - Target coverage: >85% on pure agent logic.
- **Tier 2: Integration Tests (API + DB + State Transitions)**
  - `test_e2e_complaint_to_admin_flow.py`: Full complaint lifecycle from creation through technician work log to resolution.
  - `test_e2e_gatepass_approval_flow.py`: Two-tier warden approval, digital QR generation, security guard departure verification.
  - `test_e2e_notice_targeting.py`: Audience segmentation (branch/hostel), read-receipt recording, automated 4h SMS fallback trigger.
- **Tier 3: Security & Authorization Boundary Tests**
  - Verification that unauthenticated requests receive 401.
  - Verification that non-admin users cannot approve gate passes (403).
  - Verification of cross-student IDOR prevention (404).

## 3. Mocking Policy
- **Never Mocked**: The database engine, password verification, authorization checks, agent routing algorithms.
- **Mocked Only When Required**: External physical hardware (GSM cellular modem serial port for SMS).

## 4. Running the Test Suite
```bash
cd backend
python -m pytest -v
```
All tests must execute in <5 seconds to enable continuous developer iteration.
