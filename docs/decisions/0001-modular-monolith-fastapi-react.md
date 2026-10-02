# ADR 0001: Modular Monolith with FastAPI and React SPA

## Context
Campus operations require tight cohesion between complaint routing, gate passes, notices, student profiles, and mess management. We evaluated a microservices architecture versus a modular monolith.

## Decision
We chose a **Modular Monolith** architecture using FastAPI (Python) for the backend and a React (Vite) Single Page Application for the frontend.

## Alternatives Considered
- **Microservices (Docker per service)**: Rejected due to operational complexity, distributed transaction overhead, and failure modes when running offline on local campus servers.
- **Django**: Rejected because FastAPI provides native asynchronous endpoints, automatic Pydantic request/response validation, and superior performance for WebSocket/voice interactions.

## Consequences
- **Positive**: Single codebase, atomic database transactions, zero network latency between services, trivial local deployment (`docker-compose up`).
- **Negative**: Must strictly enforce domain boundaries (`/agents`, `/db`, `/api`) in code to prevent tight coupling.
