# Runbook: Production Deployment Guide

## 1. Prerequisites
- Target server: Linux (Ubuntu 22.04 LTS or Debian 12 recommended).
- Installed tools: Docker 24+, Docker Compose v2+, or Python 3.11+ and Node.js 20+.
- Domain and SSL: Reverse proxy configured with Let's Encrypt SSL certificates.

## 2. Zero-Downtime Deployment via Docker Compose
1. Clone the repository and navigate to root:
   ```bash
   git clone <repo-url> /opt/campus-life-os
   cd /opt/campus-life-os
   ```
2. Configure production environment:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with a strong production SECRET_KEY
   nano backend/.env
   ```
3. Run the automated test suite before building:
   ```bash
   cd backend && python -m pytest && cd ..
   ```
4. Build and start containers:
   ```bash
   docker-compose up -d --build
   ```
5. Verify health:
   ```bash
   curl -s http://localhost:8000/api/health | grep '"status":"healthy"'
   ```

## 3. Post-Deploy Smoke Tests
1. Verify student demo login.
2. Verify Admin Control Tower metrics loading.
3. Test gate pass creation and QR render.
4. Verify 3D Campus Quest map renders on desktop and mobile.
