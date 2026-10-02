# Hosting Architecture & Cost Model

## 1. Hosting Architecture Overview
Campus Life OS is designed to run in three operational modes:
1. **On-Premises / Air-Gapped Campus Server**: Single campus server running Ubuntu Linux with Docker Compose. Zero recurring cloud fees.
2. **Hybrid Cloud (AWS/DigitalOcean/Hetzner)**: Single VPS (4 vCPU, 8GB RAM) running FastAPI + SQLite/Postgres + Nginx.
3. **PaaS Cloud (Railway / Render + Supabase)**: Managed compute with Postgres database.

## 2. Infrastructure Cost Modeling

| Component | Year 1 Launch (5,000 Students) | 10x Scale (50,000 Multi-Campus) |
| :--- | :--- | :--- |
| **Compute** | 1x VPS (4 vCPU / 8GB RAM) = $24/month | 3x Compute Nodes behind Load Balancer = $120/month |
| **Database** | Local SQLite / Managed Postgres = $0 - $15/month | Managed HA PostgreSQL (RDS / Supabase) = $70/month |
| **Object Storage**| Local disk / Cloudflare R2 (10GB) = $0/month | Cloudflare R2 (250GB) = $5/month |
| **SMS Gateway** | Local GSM SIM Modem ($5/mo SIM) = $5/month | Cloud SMS API (Twilio / MSG91) = $60/month |
| **Total Est. Cost**| **~$29 to $44 / month** | **~$255 / month** |

## 3. Environment Variables Discipline
- All production configuration is injected via standard environment variables (documented in `.env.example`).
- Startup runtime validation halts execution immediately if `SECRET_KEY` is at default or invalid.
