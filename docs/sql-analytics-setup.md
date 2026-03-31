# SQL Analytics Setup

Guide to setting up the SQL analytics layer for MyCircle — PostgreSQL database, HTTP proxy, Cloudflare tunnel, and the Setup page configuration.

## Overview

MyCircle can optionally mirror AI chat logs and benchmark results to an external PostgreSQL database for advanced analytics (percentile latency, tool co-occurrence, cost tracking, full-text search). Firestore remains the primary data store — SQL is a supplementary 2nd source.

```
MyCircle Cloud Functions (HTTP POST to /query)
    ├── Firestore (primary, real-time)
    └── Cloudflare Tunnel (HTTPS)
           ↓
     sql-proxy (Express, port 3080)
           ↓
     PostgreSQL (port 5432, internal only)
```

Cloud Functions communicate with PostgreSQL via a lightweight HTTP proxy (`sql-proxy`). This works through any Cloudflare tunnel — including the free quick tunnel that requires no account.

## Quick Start (Docker Compose)

> **Ready-to-use file**: [`deploy/sql-proxy/docker-compose.yml`](../deploy/sql-proxy/docker-compose.yml)

**1. Edit secrets**

```bash
cd deploy/sql-proxy
# Edit docker-compose.yml — change POSTGRES_PASSWORD and API_KEY
```

**2. Start everything**

```bash
docker compose up -d
```

This starts 3 containers:
- `postgres` — PostgreSQL 16 database
- `sql-proxy` — HTTP-to-SQL proxy (Express)
- `cloudflared` — Cloudflare tunnel (free, no account needed)

**3. Get the tunnel URL**

```bash
docker compose logs cloudflared 2>&1 | grep trycloudflare.com
```

You'll see something like: `https://random-words-here.trycloudflare.com`

**4. Configure in MyCircle**

1. Open MyCircle → click your **avatar** (top right) → **Setup**
2. **SQL Connection** tab:
   - **Tunnel URL**: paste the `trycloudflare.com` URL from step 3
   - **API Key**: the `API_KEY` value from your docker-compose.yml
3. Click **Save & Test**
4. You should see a green "Connected" status

Tables are created automatically on first successful connection.

## Architecture

### Why an HTTP proxy?

Cloudflare tunnels expose HTTP/HTTPS endpoints. PostgreSQL uses a raw TCP wire protocol that doesn't work through HTTP tunnels. The `sql-proxy` bridges this gap — it accepts HTTP POST requests with SQL queries and forwards them to PostgreSQL internally.

### Components

| Component | Image | Port | Purpose |
|-----------|-------|------|---------|
| `postgres` | `postgres:16-alpine` | 5432 (internal) | Database — not exposed to the internet |
| `sql-proxy` | Custom Node.js | 3080 (internal) | HTTP → SQL bridge, API key auth |
| `cloudflared` | `cloudflare/cloudflared` | — | Exposes sql-proxy as HTTPS endpoint |

### Security

- PostgreSQL is **never exposed** to the internet — only accessible within the Docker network
- `sql-proxy` requires an **API key** header (`X-API-Key`) on all `/query` requests
- The `/health` endpoint is unauthenticated (used for connection testing)
- Cloudflare tunnel provides HTTPS encryption in transit

## Manual Setup (Without Docker Compose)

### 1. Start PostgreSQL

```bash
docker run -d \
  --name mycircle-postgres \
  --network mycircle-sql \
  -e POSTGRES_DB=mycircle \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=changeme \
  -v mycircle-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

### 2. Build and start the proxy

```bash
cd deploy/sql-proxy
docker build -t mycircle-sql-proxy .
docker run -d \
  --name mycircle-sql-proxy \
  --network mycircle-sql \
  -e DATABASE_URL=postgres://postgres:changeme@mycircle-postgres:5432/mycircle \
  -e API_KEY=your-secret-key \
  -p 3080:3080 \
  mycircle-sql-proxy
```

### 3. Start Cloudflare tunnel

```bash
docker run -d \
  --name mycircle-tunnel \
  --network mycircle-sql \
  cloudflare/cloudflared:latest \
  tunnel --url http://mycircle-sql-proxy:3080
```

### 4. Get URL and configure

```bash
docker logs mycircle-tunnel 2>&1 | grep trycloudflare.com
```

Enter the URL + API key in MyCircle Setup page.

## Import Historical Data (Optional)

1. Go to Setup > **Import History** tab
2. Click **Import History**
3. Watch the progress indicator
4. If interrupted, click **Resume Import** to continue

## AI Endpoints

The Setup page also centralizes AI endpoint management:

1. Go to Setup > **AI Endpoints** tab
2. Add Ollama endpoint(s) here
3. Available across AI Chat, AI Interviewer, and Model Benchmark

## Analytics Dashboard

Once data is flowing:

1. Setup > **Analytics** tab
2. View: Usage Summary, Cost Breakdown, Latency Percentiles (P50/P90/P99), Tool Usage, Benchmark Trends

## Chat History Search

1. Setup > **Chat Search** tab
2. Search by keyword across all past AI conversations

## How Dual-Write Works

- Every AI chat/benchmark is written to Firestore **and** SQL (via HTTP to the proxy)
- SQL writes are **fire-and-forget** — if the tunnel is down, everything works normally
- When SQL is not configured, zero impact on existing features

## Troubleshooting

### "Connection Error" on Save & Test

```bash
# Check all containers are running
docker compose ps

# Check proxy logs
docker compose logs sql-proxy

# Test proxy directly
curl http://localhost:3080/health
```

### Tunnel URL changes on restart

The free quick tunnel generates a new random URL each restart. For a persistent URL, use a named Cloudflare tunnel (requires free account):

```bash
cloudflared tunnel login
cloudflared tunnel create mycircle-sql
cloudflared tunnel route dns mycircle-sql sql.yourdomain.com
```

Then update docker-compose.yml to use `tunnel run mycircle-sql` instead of `tunnel --url`.

### Backfill stuck or errored

Check Setup > Import History for the error. Click **Resume Import** to continue from the last checkpoint.

### 401 Unauthorized from proxy

Check that the API key in MyCircle Setup matches the `API_KEY` in docker-compose.yml exactly.

## Stopping / Removing

```bash
# Stop
docker compose down

# Remove data too (DESTRUCTIVE)
docker compose down -v
```

To disconnect from MyCircle without stopping Docker: Setup > SQL Connection > **Remove Connection**.

## SQL Schema

Created automatically on first connection:

| Table | Purpose |
|-------|---------|
| `ai_chat_logs` | AI chat interactions (provider, model, tokens, latency, text) |
| `ai_tool_calls` | Tool invocations per chat (name, duration, error) |
| `benchmark_results` | Benchmark results (endpoint, model, TPS, TTFT, quality) |
| `feature_events` | Generic events (future use) |
