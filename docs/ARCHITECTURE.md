# Architecture

## System Overview

AI Ops Dashboard is a three-tier application: a React SPA frontend, a Node.js backend with WebSocket support, and PostgreSQL for persistence. An AI layer (Claude API) runs asynchronously on a 30-second cycle to analyze metric patterns.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                │
│                                                                 │
│  Simulator ──(2s)──▶ PostgreSQL ──(30s)──▶ Anomaly Detector    │
│      │                    │                       │              │
│      │                    │                  Claude API          │
│      │                    │                       │              │
│      ▼                    ▼                       ▼              │
│  Socket.io ◀─── Express REST ◀─── ai_analyses + alerts         │
│      │                                            │              │
│      ▼                                            │              │
│  React Dashboard ◀────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Metric Lifecycle

1. **Generation:** The simulator creates a `MetricPoint` every 2 seconds with CPU, memory, latency, error rate, and request count values. Normal values follow realistic ranges with anomalies injected every ~30 seconds.

2. **Ingestion:** The backend receives the metric, inserts it into `metrics_history`, and broadcasts it via `metrics_update` WebSocket event.

3. **Analysis:** Every 30 seconds, the anomaly detector queries the last 5 minutes of metrics, formats them into a prompt, and sends them to Claude for analysis.

4. **Alert creation:** If Claude detects an anomaly, the result is stored in `ai_analyses`, an alert is created in `alerts`, and both `anomaly_detected` and `new_alert` events are emitted via WebSocket.

5. **Display:** The React frontend receives events and updates the UI in real-time — metric cards, charts, AI insights panel, and alert feed all update without polling.

## Database Schema

```sql
metrics_history          ai_analyses              alerts
┌──────────────────┐    ┌──────────────────────┐  ┌───────────────────┐
│ id (SERIAL PK)   │    │ id (SERIAL PK)       │  │ id (SERIAL PK)    │
│ cpu_usage        │    │ anomaly_detected     │  │ analysis_id (FK)  │──▶ ai_analyses.id
│ memory_usage     │    │ severity             │  │ severity          │
│ api_latency_ms   │    │ description          │  │ title             │
│ error_rate       │    │ recommended_action   │  │ description       │
│ request_count    │    │ metrics_snapshot (JSON)│ │ acknowledged      │
│ timestamp        │    │ created_at           │  │ created_at        │
└──────────────────┘    └──────────────────────┘  └───────────────────┘

configurations
┌──────────────────┐
│ id (SERIAL PK)   │
│ key (UNIQUE)     │
│ value (JSONB)    │
│ updated_at       │
└──────────────────┘
```

## AI Analysis Pipeline

### Prompt Design

The LLM receives a structured prompt listing each metric point in the 5-minute window with values and timestamps. Normal operating ranges are specified as context:

- CPU: 20-60%
- Memory: 40-70%
- Latency: 50-200ms
- Error rate: 0-2%

The LLM returns a JSON object with four fields:
- `anomaly_detected` (boolean)
- `severity` (critical | high | medium | low | none)
- `description` (natural-language observation)
- `recommended_action` (what to do)

### Mock Analysis Fallback

When `ANTHROPIC_API_KEY` is not set, rule-based detection activates:

| Condition | Severity |
|---|---|
| CPU > 85% AND error rate > 10% | critical |
| CPU > 85% | high |
| Error rate > 10% | high |
| Latency > 500ms | medium |
| None of the above | none |

## WebSocket Protocol

### Connection

```javascript
io(API_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
})
```

### Events

| Event | Payload | Frequency |
|---|---|---|
| `metrics_update` | `MetricPoint` object | Every 2s |
| `anomaly_detected` | `AiAnalysis` object | When anomaly found (~30s cycle) |
| `new_alert` | `Alert` object | When anomaly creates alert |

### Client-Side Buffering

The `useWebSocket` hook maintains a rolling buffer of the last 100 metric points for chart rendering. Older points are dropped from the buffer (but remain in PostgreSQL for historical queries).

## Docker Architecture

```
docker-compose.yml
├── postgres (postgres:16-alpine)
│   ├── Port: 5433:5432
│   ├── Volume: pgdata
│   └── Healthcheck: pg_isready
├── backend (Node.js, multi-stage build)
│   ├── Port: 3001:3001
│   ├── Depends: postgres (healthy)
│   └── Env: DATABASE_URL, ANTHROPIC_API_KEY
└── frontend (nginx:alpine, multi-stage build)
    ├── Port: 3000:80
    ├── Depends: backend
    └── Nginx: reverse proxy /api/* and /socket.io/* to backend
```

The frontend nginx config handles both static file serving and reverse proxying API/WebSocket requests to the backend, so the browser only needs to connect to port 3000.

## Design Decisions

**Why Socket.io over raw WebSocket?** Auto-reconnect, room support, and fallback to long-polling. For a monitoring dashboard, connection resilience matters more than minimal overhead.

**Why 30-second analysis cycles?** Balances responsiveness with API cost. Sub-30s cycles increase cost linearly without significantly improving detection quality since metric anomalies typically persist for multiple data points.

**Why store metrics in PostgreSQL instead of a time-series DB?** Simplicity. PostgreSQL handles the data volume for a demo/portfolio project. The sliding-window queries use standard SQL. A production system at scale would use TimescaleDB or InfluxDB.

**Why Recharts?** React-native charting library with good TypeScript support and built-in responsiveness. Lighter than D3 for the chart types needed (area, sparkline).
