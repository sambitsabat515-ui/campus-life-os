# Monitoring, Metrics & Alerting Plan

## 1. Overview
Monitoring provides proactive operational visibility for campus administrators before students experience disruptions.

## 2. Health Check Architecture
- **Lightweight Liveness**: `/api/health/live`
  - Returns `{"status": "alive"}` immediately (HTTP 200).
  - Used by container orchestrators (Kubernetes / Docker) and uptime monitors.
- **Deep Readiness**: `/api/health`
  - Verifies database connection and query response time.
  - Verifies storage partition write permissions.
  - Verifies memory and model status.
  - Returns component-level status:
    ```json
    {
      "status": "healthy",
      "components": {
        "database": "UP",
        "storage": "UP",
        "offline_voice": "UP"
      }
    }
    ```

## 3. Key Operational Metrics
- **Technical Metrics**:
  - Request rate and P95 latency per route.
  - 5xx error rate (Alert threshold: >2% for 3 minutes).
  - Active database session count.
- **Business Metrics**:
  - Open complaints count and >48h SLA breach count.
  - Gate passes issued vs departed vs active outside campus.
  - Notice read-receipt completion percentage.
