# Runbook: Deploying Campus Life OS to Wasmer Edge

## 1. Overview
[Wasmer](https://wasmer.io/) is an ultra-fast WebAssembly runtime and global Edge platform. It executes applications compiled to WebAssembly (WASI) within sandboxed, serverless edge nodes featuring near-zero cold starts and worldwide edge distribution.

In Campus Life OS, the deployment is structured as follows:
- **Wasmer Edge (Frontend & 3D WebGL Assets)**: Serves the React 18 SPA, design tokens, Three.js 3D models (`campus_bput.glb`), and routing logic via the high-performance `wasmer/static-web-server` package with SPA fallback.
- **Backend API Service**: The FastAPI backend runs on any standard host (Railway, Render, Fly.io, or university on-premises server) with SQLite or PostgreSQL, providing REST endpoints and agent intelligence.

---

## 2. Prerequisites

### A. Install the Wasmer CLI

- **Windows (PowerShell)**:
  ```powershell
  iwr https://win.wasmer.io -useb | iex
  ```
  *Or via winget:*
  ```powershell
  winget install Wasmer.Wasmer
  ```

- **Linux / macOS**:
  ```bash
  curl https://get.wasmer.io -sSfL | sh
  ```

Verify installation:
```bash
wasmer --version
```

### B. Authenticate with Wasmer
Create a free account at [wasmer.io](https://wasmer.io) and authenticate your CLI:
```bash
wasmer login
```
*This opens your browser to generate and save your authentication token.*

---

## 3. Configuration Files in the Repository

The repository includes pre-configured deployment manifests:

1. **`wasmer.toml`**: Defines the package, maps the built `frontend/dist` directory to `/public`, and attaches `wasmer/static-web-server`:
   ```toml
   [package]
   name = "sambitsabat515-ui/campus-life-os"
   version = "1.0.0"
   description = "Campus Life OS on Wasmer Edge"

   [dependencies]
   "wasmer/static-web-server" = "^1"

   [fs]
   "/public" = "frontend/dist"
   "/etc/static-web-server" = "etc/static-web-server"

   [[command]]
   name = "start"
   module = "wasmer/static-web-server:webserver"
   runner = "wasi"

   [command.annotations.wasi]
   env = ["SERVER_CONFIG_FILE=/etc/static-web-server/config.toml"]
   ```

2. **`app.yaml`**: Wasmer Edge App definition for single-command deploy:
   ```yaml
   kind: wasmer.io/App.v0
   name: campus-life-os
   package: sambitsabat515-ui/campus-life-os
   ```

3. **`etc/static-web-server/config.toml`**: Configures SPA client-side routing (`page-fallback = "/public/index.html"`), gzip/brotli compression, and long-term caching for 3D GLB assets.

---

## 4. Step-by-Step Deployment Guide

### Step 1: Set Backend API URL (If Deployed Separately)
In `frontend/.env`, set the backend URL:
```env
VITE_API_BASE_URL="https://your-backend-api.up.railway.app"
```
*(If running locally or testing the UI, leave it blank to use relative paths)*.

### Step 2: Build the Production Frontend
Build the optimized React bundle and Three.js 3D assets:
```bash
cd frontend
npm install
npm run build
cd ..
```
*This generates the `frontend/dist/` directory containing `index.html`, assets, and `campus_bput.glb`.*

### Step 3: Test Locally Using the Wasmer Wasm Runtime
Before deploying to the cloud, you can test the exact Wasmer WebAssembly package locally:
```bash
wasmer run . --net -- --port 8080
```
Open `http://localhost:8080` in your browser to verify the 3D Campus Quest map and UI load seamlessly through the WASI runtime.

### Step 4: Deploy to Wasmer Edge
From the root of the project, execute:
```bash
wasmer deploy
```
During deployment:
1. The CLI packages the `frontend/dist` directory and manifests.
2. It publishes the package to your Wasmer registry namespace.
3. It deploys the app to the Wasmer Edge network.
4. It outputs your live URL:
   ```
   Deploying app campus-life-os...
   > App deployed to: https://campus-life-os.wasmer.app
   ```

---

## 5. Connecting the Backend

Because Wasmer Edge operates on WebAssembly sandboxes, your FastAPI backend can be connected via two methods:

### Option A: Cloud Backend (Recommended for Hackathons & Production)
Deploy `backend/` to [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io) with one click using the included [`backend/Dockerfile`](../../backend/Dockerfile).
Then set `VITE_API_BASE_URL` in `frontend/.env` to your backend URL and run `wasmer deploy`.

### Option B: Unified Docker Deployment (On-Premises / VPS)
If your university runs an on-premises Linux server, deploy the full stack with single-command Docker:
```bash
docker-compose up -d --build
```
This runs both the backend and frontend simultaneously with zero cloud dependencies.

---

## 6. Troubleshooting & Gotchas

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| `Error: directory 'frontend/dist' does not exist` | Forgot to build frontend | Run `cd frontend && npm run build` before `wasmer deploy`. |
| `404 Not Found` on sub-routes (e.g. `/student/map`) | SPA routing fallback missing | Verified in `etc/static-web-server/config.toml` via `page-fallback = "/public/index.html"`. |
| CORS error when connecting to API | Backend missing origin | FastAPI backend already has `CORSMiddleware` configured with `allow_origins=["*"]` in `backend/app/main.py`. |
| `wasmer: command not found` | CLI not in system PATH | Restart your terminal after installing Wasmer or add Wasmer to your PATH environment variable. |
