# Deployment Guide — AI Ops Dashboard

## Option 1: Render (Recommended)

### Prerequisites
- Render account (https://render.com)
- GitHub repo connected to Render

### Steps

1. **Create a Blueprint** on Render:
   - Go to Dashboard → New → Blueprint
   - Connect this repository
   - Render reads `render.yaml` and provisions: backend, database, frontend

2. **Set environment variables** after Blueprint creates the services:
   - **Backend:**
     - `ANTHROPIC_API_KEY` — your Anthropic API key (optional; mock fallback works without it)
   - **Frontend:**
     - `VITE_API_URL` — the backend URL (e.g., `https://aiops-backend.onrender.com`)
     - This is needed for WebSocket connections (Socket.io connects directly to backend)

3. **Redeploy frontend** after setting `VITE_API_URL` (it's a build-time variable).

4. **Verify**:
   - Backend API: `https://aiops-backend.onrender.com/api/metrics/current`
   - Frontend: `https://aiops-frontend.onrender.com`
   - WebSocket: dashboard should show live-updating metrics

### Important Notes
- **WebSocket**: Socket.io connects from the browser directly to the backend URL. The rewrite rule handles REST API calls, but WebSocket uses the `VITE_API_URL` directly.
- **Mock mode**: If `ANTHROPIC_API_KEY` is not set, the anomaly detector uses a mock fallback — alerts still generate.

---

## Option 2: Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway add --plugin postgresql

# Deploy backend
cd backend && railway up

# Deploy frontend (separate service, set VITE_API_URL to backend URL)
cd ../frontend && railway up
```

---

## Option 3: Docker Compose (local/VPS)

```bash
ANTHROPIC_API_KEY=sk-ant-... docker-compose up -d
```

Frontend: `http://localhost:3000`, Backend: `http://localhost:3001`.
