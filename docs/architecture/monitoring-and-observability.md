# Monitoring and Observability

## Health Checks

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "latency_ms": 5
  },
  "embedding_service": {
    "status": "ready",
    "model": "paraphrase-multilingual-MiniLM-L12-v2",
    "queue_size": 3
  }
}
```

---

## Metrics to Monitor

**Application Metrics:**
- Request rate (requests/second)
- Error rate (errors/second)
- Response time (p50, p95, p99)
- Active users (concurrent sessions)

**Business Metrics:**
- Notes created (per day)
- Searches performed (per day)
- Average search latency
- Embedding success rate
- MCP tool calls (per day)

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Database connections
- Queue depth

---

## Future: Observability Stack (v2.0+)

**Metrics:** Prometheus + Grafana
**Logs:** Loki or ELK Stack
**Tracing:** OpenTelemetry + Jaeger
**Error Tracking:** Sentry (opt-in only)

---
