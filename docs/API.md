# API Reference

Base URL: `http://localhost:3001` (direct) or `http://localhost:3000/api` (via nginx proxy)

Interactive documentation available at [/api-docs](http://localhost:3001/api-docs) (Swagger UI).

## REST Endpoints

### Health Check

```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-16T07:30:00.000Z"
}
```

---

### Get Current Metrics

```
GET /api/metrics/current
```

Returns the latest single metric data point.

**Response:**
```json
{
  "id": 1234,
  "cpu_usage": 42.5,
  "memory_usage": 58.3,
  "api_latency_ms": 127.8,
  "error_rate": 0.8,
  "request_count": 342,
  "timestamp": "2026-03-16T07:30:02.000Z"
}
```

---

### Get Metrics History

```
GET /api/metrics/history?range={range}
```

**Parameters:**

| Name | Type | Default | Description |
|---|---|---|---|
| range | string | 1h | Time range: `1h`, `6h`, or `24h` |

**Response:** Array of `MetricPoint` objects, oldest first.

**Limits:** 180 points (1h), 1080 points (6h), 4320 points (24h).

```json
[
  {
    "id": 1200,
    "cpu_usage": 35.2,
    "memory_usage": 52.1,
    "api_latency_ms": 98.4,
    "error_rate": 0.3,
    "request_count": 287,
    "timestamp": "2026-03-16T06:30:00.000Z"
  }
]
```

---

### List Alerts

```
GET /api/alerts
```

Returns the 50 most recent alerts, newest first.

**Response:**
```json
[
  {
    "id": 15,
    "analysis_id": 42,
    "severity": "high",
    "title": "CPU spike detected",
    "description": "CPU usage spiked to 94% at 07:29, significantly above the normal 20-60% range...",
    "acknowledged": false,
    "created_at": "2026-03-16T07:29:30.000Z"
  }
]
```

---

### Get Alert Detail

```
GET /api/alerts/:id
```

Returns a single alert with its associated AI analysis.

**Response:**
```json
{
  "id": 15,
  "analysis_id": 42,
  "severity": "high",
  "title": "CPU spike detected",
  "description": "CPU usage spiked to 94% at 07:29...",
  "acknowledged": false,
  "created_at": "2026-03-16T07:29:30.000Z",
  "anomaly_detected": true,
  "recommended_action": "Investigate processes consuming excessive CPU. Check for runaway queries or background jobs.",
  "metrics_snapshot": [
    {
      "cpu_usage": 94.2,
      "memory_usage": 61.5,
      "api_latency_ms": 312.4,
      "error_rate": 1.2,
      "request_count": 401,
      "timestamp": "2026-03-16T07:29:02.000Z"
    }
  ]
}
```

---

### Get Configuration

```
GET /api/config
```

**Response:**
```json
{
  "id": 1,
  "key": "thresholds",
  "value": {
    "cpu_usage": 85,
    "memory_usage": 90,
    "api_latency_ms": 500,
    "error_rate": 10
  },
  "updated_at": "2026-03-16T07:00:00.000Z"
}
```

---

### Update Configuration

```
POST /api/config
Content-Type: application/json
```

**Request Body:**
```json
{
  "cpu_usage": 80,
  "memory_usage": 85,
  "api_latency_ms": 400,
  "error_rate": 5
}
```

All fields are numbers representing threshold values. Upserts the `thresholds` configuration key.

**Response:** Updated configuration object (same shape as GET).

---

## WebSocket Events

Connect via Socket.io to the backend server.

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
```

### metrics_update

Emitted every 2 seconds with the latest metric reading.

```json
{
  "id": 1234,
  "cpu_usage": 42.5,
  "memory_usage": 58.3,
  "api_latency_ms": 127.8,
  "error_rate": 0.8,
  "request_count": 342,
  "timestamp": "2026-03-16T07:30:02.000Z"
}
```

### anomaly_detected

Emitted when the AI analysis detects an anomaly.

```json
{
  "id": 42,
  "anomaly_detected": true,
  "severity": "high",
  "description": "CPU usage spiked to 94% at 07:29, significantly above the normal 20-60% range. Memory and latency remain within bounds, suggesting a compute-bound issue rather than a systemic overload.",
  "recommended_action": "Investigate processes consuming excessive CPU. Check for runaway queries or background jobs that may have been triggered recently.",
  "metrics_snapshot": [ ... ],
  "created_at": "2026-03-16T07:29:30.000Z"
}
```

### new_alert

Emitted when an anomaly triggers a new alert.

```json
{
  "id": 15,
  "analysis_id": 42,
  "severity": "high",
  "title": "CPU spike detected",
  "description": "CPU usage spiked to 94% at 07:29...",
  "acknowledged": false,
  "created_at": "2026-03-16T07:29:30.000Z"
}
```

## Data Types

### MetricPoint

| Field | Type | Description |
|---|---|---|
| id | number | Auto-incrementing primary key |
| cpu_usage | number | CPU utilization percentage (0-100) |
| memory_usage | number | Memory utilization percentage (0-100) |
| api_latency_ms | number | API response latency in milliseconds |
| error_rate | number | Error rate percentage (0-100) |
| request_count | number | Number of requests in the interval |
| timestamp | string (ISO 8601) | When the metric was recorded |

### AiAnalysis

| Field | Type | Description |
|---|---|---|
| id | number | Auto-incrementing primary key |
| anomaly_detected | boolean | Whether an anomaly was found |
| severity | string | `critical`, `high`, `medium`, `low`, or `none` |
| description | string | Natural-language description of findings |
| recommended_action | string | Suggested remediation steps |
| metrics_snapshot | MetricPoint[] | The metrics window that was analyzed |
| created_at | string (ISO 8601) | When the analysis was performed |

### Alert

| Field | Type | Description |
|---|---|---|
| id | number | Auto-incrementing primary key |
| analysis_id | number | Foreign key to the triggering AI analysis |
| severity | string | `critical`, `high`, `medium`, `low` |
| title | string | Short alert title |
| description | string | Detailed alert description |
| acknowledged | boolean | Whether the alert has been acknowledged |
| created_at | string (ISO 8601) | When the alert was created |
