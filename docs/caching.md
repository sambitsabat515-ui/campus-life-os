# Caching & CDN Architecture

## 1. Overview
In campus environments with variable bandwidth, caching preserves server capacity while strict scoping guarantees students never see stale or cross-tenant data.

## 2. Caching Strategy Matrix

| Asset / Endpoint | Layer | Cache-Control Header | Invalidation Event |
| :--- | :--- | :--- | :--- |
| **Static Assets** (`.js`, `.css`, fonts) | Browser & CDN | `public, max-age=31536000, immutable` | Content-hashed filenames on Vite build |
| **3D Campus Model** (`campus_bput.glb`)| Browser & CDN | `public, max-age=86400, stale-while-revalidate=43200` | New model upload by Admin |
| **Public Timetable & Mess Menu** | In-Memory / CDN | `public, max-age=300` | Mess supervisor menu update |
| **Authenticated APIs** (Passes, Tickets) | Browser | `private, no-cache, no-store, must-revalidate` | Never cached on shared layers |
| **Notice Feed** | Client App State | Cached locally in React State | New notice polling / WebSocket event |

## 3. Cache Invalidation Rules
- All authenticated responses explicitly emit `Cache-Control: no-store, private` to prevent shared proxy or browser history leakage of sensitive student passes.
