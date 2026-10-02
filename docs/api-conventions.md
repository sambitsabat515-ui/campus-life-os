# API Conventions & Error Standards

## 1. Overview
All endpoints adhere to REST conventions, strict Pydantic v2 input validation, and a standardized JSON error envelope with unique request tracing IDs.

## 2. Standard Response Envelope for Errors
All 4xx and 5xx responses must return the following JSON structure:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Complaint #45 not found",
    "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "details": {}
  }
}
```

### Standard Error Codes
- `UNAUTHENTICATED`: Missing or invalid Bearer JWT token (HTTP 401).
- `PERMISSION_DENIED`: Authenticated user lacks RBAC permission (HTTP 403).
- `RESOURCE_NOT_FOUND`: Resource does not exist or user is forbidden from knowing it exists (HTTP 404).
- `VALIDATION_ERROR`: Malformed input or schema constraint violation (HTTP 422 / 400).
- `RATE_LIMIT_EXCEEDED`: Too many requests within window, `Retry-After` header set (HTTP 429).
- `INTERNAL_SERVER_ERROR`: Unhandled exception, logged with full traceback (HTTP 500).

## 3. URL & Naming Conventions
- Resources use plural lowercase nouns: `/api/complaints`, `/api/gatepasses`, `/api/notices`.
- Action endpoints use verbs when non-CRUD: `/api/gatepasses/{id}/approve`, `/api/voice/intent`.
- Query parameters use snake_case: `?page=1&limit=20&status=PENDING`.

## 4. Pagination Standard
All list endpoints support limit-offset parameters:
- `limit`: Default `20`, maximum `100`.
- `offset`: Default `0`.
Responses include:
```json
{
  "items": [...],
  "total": 142,
  "limit": 20,
  "offset": 0
}
```

## 5. Security & Trace Headers
- `X-Request-ID`: Generated for every incoming request and attached to both logs and response headers.
- `Content-Security-Policy`: Modern restrictive script/style sources.
- `X-Content-Type-Options`: `nosniff`.
- `X-Frame-Options`: `DENY` or `SAMEORIGIN`.
