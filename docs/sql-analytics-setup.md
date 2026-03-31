# SQL Analytics Setup

Guide to setting up the SQL analytics layer for MyCircle — PostgreSQL database, Cloudflare tunnel, and the Setup page configuration.

## Overview

MyCircle can optionally mirror AI chat logs and benchmark results to an external PostgreSQL database for advanced analytics (percentile latency, tool co-occurrence, cost tracking, full-text search). Firestore remains the primary data store — SQL is a supplementary 2nd source.

```
MyCircle Cloud Functions
    ├── Firestore (primary, real-time)
    └── PostgreSQL (supplementary, via Cloudflare tunnel)
           ↑
     Cloudflare Tunnel
           ↑
     Docker container (your machine)
           ↑
     PostgreSQL (Docker)
```

## Prerequisites

- Docker installed on your machine
- A Cloudflare account (free tier works)
- `cloudflared` CLI or Docker image

## Step 1: Start PostgreSQL with Docker

```bash
docker run -d \
  --name mycircle-postgres \
  -e POSTGRES_DB=mycircle \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your-secure-password \
  -p 5432:5432 \
  -v mycircle-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

Verify it's running:

```bash
docker exec mycircle-postgres psql -U postgres -d mycircle -c "SELECT 1"
```

## Step 2: Set Up Cloudflare Tunnel

### Option A: Using `cloudflared` Docker container (recommended)

```bash
# Create a tunnel (one-time setup)
docker run -it --rm \
  -v cloudflared-config:/etc/cloudflared \
  cloudflare/cloudflared:latest \
  tunnel login

# Create the tunnel
docker run -it --rm \
  -v cloudflared-config:/etc/cloudflared \
  cloudflare/cloudflared:latest \
  tunnel create mycircle-sql

# Note the tunnel ID from the output (e.g., abc123-def456-...)
```

### Configure the tunnel

Create a config file at the cloudflared volume or bind-mount:

```yaml
# config.yml
tunnel: <your-tunnel-id>
credentials-file: /etc/cloudflared/<tunnel-id>.json

ingress:
  - hostname: sql.yourdomain.com
    service: tcp://host.docker.internal:5432
  - service: http_status:404
```

### Add DNS record

```bash
docker run --rm \
  -v cloudflared-config:/etc/cloudflared \
  cloudflare/cloudflared:latest \
  tunnel route dns mycircle-sql sql.yourdomain.com
```

### Run the tunnel

```bash
docker run -d \
  --name mycircle-tunnel \
  --restart unless-stopped \
  -v cloudflared-config:/etc/cloudflared \
  cloudflare/cloudflared:latest \
  tunnel run mycircle-sql
```

### Option B: Using `cloudflared` CLI directly

```bash
# Install cloudflared
# macOS: brew install cloudflared
# Windows: winget install Cloudflare.cloudflared
# Linux: see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

cloudflared tunnel login
cloudflared tunnel create mycircle-sql
cloudflared tunnel route dns mycircle-sql sql.yourdomain.com

# Create config.yml in ~/.cloudflared/
# Then run:
cloudflared tunnel run mycircle-sql
```

### Option C: Docker Compose (both services together)

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mycircle
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your-secure-password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run mycircle-sql
    volumes:
      - ./cloudflared:/etc/cloudflared
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  pgdata:
```

```bash
docker compose up -d
```

## Step 3: Configure in MyCircle

1. Open MyCircle in your browser
2. Click your **profile avatar** (top right) to open the user menu
3. Click **Setup**
4. In the **SQL Connection** tab:
   - **Tunnel URL**: Enter your Cloudflare tunnel URL (e.g., `https://sql.yourdomain.com`)
   - **Database Name**: `mycircle` (or whatever you set in POSTGRES_DB)
   - **Username**: `postgres`
   - **Password**: The password you set in POSTGRES_PASSWORD
5. Click **Save & Test**
6. You should see a green "Connected" status

The app automatically creates the required tables (`ai_chat_logs`, `ai_tool_calls`, `benchmark_results`, `feature_events`) on first successful connection.

## Step 4: Import Historical Data (Optional)

1. Go to Setup > **Import History** tab
2. Click **Import History**
3. Watch the progress indicator as existing Firestore chat logs and benchmark results are migrated
4. If interrupted, click **Resume Import** to continue from where it stopped

## Step 5: Configure AI Endpoints

The Setup page also centralizes AI endpoint management:

1. Go to Setup > **AI Endpoints** tab
2. Add your Ollama endpoint(s) here (URL, name, optional Cloudflare Access credentials)
3. Endpoints configured here are available across **AI Chat**, **AI Interviewer**, and **Model Benchmark**

## Using the Analytics Dashboard

Once data is flowing (either via backfill or new AI chat interactions):

1. Go to Setup > **Analytics** tab
2. View:
   - **Usage Summary**: Total calls, tokens, provider/model breakdowns, daily chart
   - **Cost Breakdown**: Estimated costs by model (configurable rates)
   - **Latency Percentiles**: P50/P90/P99 by provider and model
   - **Tool Usage**: Most-used tools and co-occurrence patterns
   - **Benchmark Trends**: Weekly TPS and TTFT trends per endpoint/model

## Chat History Search

1. Go to Setup > **Chat Search** tab
2. Type a keyword to search across all past AI conversations
3. Results show matching conversations with highlighted context

## How Dual-Write Works

When SQL is configured:
- Every AI chat interaction is written to both Firestore **and** SQL
- Every benchmark result is written to both Firestore **and** SQL
- SQL writes are **fire-and-forget** — if the tunnel is down, AI chat works normally
- Firestore remains the source of truth for the live app

When SQL is NOT configured:
- Everything works exactly as before — zero impact on existing features

## Troubleshooting

### "Connection Error" on Save & Test

- Verify your Docker containers are running: `docker ps`
- Check the tunnel is active: `docker logs mycircle-tunnel`
- Verify PostgreSQL accepts connections: `docker exec mycircle-postgres pg_isready`
- Check the tunnel URL is correct (include `https://`)

### Tunnel is running but connection fails

- Ensure the tunnel config routes to the correct PostgreSQL port (5432)
- If using Docker-to-Docker, use `host.docker.internal` instead of `localhost`
- Check Cloudflare DNS records point to the tunnel

### Backfill stuck or errored

- Check the Setup > Import History tab for the error message
- Click **Resume Import** to continue from the last checkpoint
- If the database is full, check disk space on the PostgreSQL volume

### Analytics show no data

- Verify the SQL connection shows "Connected" on the Setup page
- Send a test AI chat message, then check the Analytics tab
- If you just configured SQL, run Import History to backfill existing data

## SQL Schema

The app creates these tables automatically:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `ai_chat_logs` | AI chat interactions | provider, model, tokens, latency, question/answer text |
| `ai_tool_calls` | Tool invocations per chat | tool_name, duration_ms, error |
| `benchmark_results` | Benchmark run results | endpoint, model, TPS, TTFT, quality score |
| `feature_events` | Generic events (future) | feature, action, metadata |

## Stopping / Removing

```bash
# Stop the tunnel and database
docker stop mycircle-tunnel mycircle-postgres

# Remove containers (data persists in volumes)
docker rm mycircle-tunnel mycircle-postgres

# Remove data volumes (DESTRUCTIVE — deletes all SQL data)
docker volume rm mycircle-pgdata cloudflared-config
```

To disconnect from MyCircle without stopping Docker:
1. Go to Setup > SQL Connection
2. Click **Remove Connection**

This removes the connection config but does NOT delete data in the database.
