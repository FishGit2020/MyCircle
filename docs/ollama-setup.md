# Ollama Self-Hosted AI Setup Guide

Complete guide for running AI chat with Ollama on your own hardware instead of Google Gemini.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Per-User Endpoints](#per-user-endpoints)
- [NAS Docker Setup](#nas-docker-setup)
- [Cloudflare Tunnel (Permanent Domain)](#cloudflare-tunnel-permanent-domain)
- [Cloudflare Access (Service Token Auth)](#cloudflare-access-service-token-auth)
- [Quick Setup (Free Tunnel, No Domain Needed)](#quick-setup-free-tunnel-no-domain-needed)
- [Apple Silicon Mac Setup](#apple-silicon-mac-setup)
- [Provider Priority](#provider-priority)
- [Tool Calling](#tool-calling)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
Browser (mycircledash.com)
   │
   │  GraphQL mutation (AiChat) with endpointId
   ▼
Firebase Cloud Functions (graphql)
   │
   │  Reads user's endpoint from Firestore
   │  (users/{uid}/benchmarkEndpoints/{id})
   │
   │  OpenAI-compatible API + CF Access headers (from Firestore)
   ▼
Cloudflare Access (service token validation)
   │
   │  Authenticated request
   ▼
Cloudflare Tunnel (nas_ollama)
   │
   │  Docker internal network
   ▼
Ollama Container (gemma2:2b)
   │
   │  Response
   ▼
Cloud Function processes tool calls → returns to browser
```

**Key components:**
- **Frontend**: Apollo Client `useMutation(AI_CHAT)` → GraphQL endpoint with `endpointId`
- **Cloud Function**: Reads user's endpoint URL + CF creds from `users/{uid}/benchmarkEndpoints` in Firestore
- **Cloudflare Access**: Validates `CF-Access-Client-Id` + `CF-Access-Client-Secret` headers (stored per-endpoint)
- **Cloudflare Tunnel**: Routes `ollama.mycircledash.com` → `http://ollama:11434` (Docker service name)
- **Ollama**: Runs in Docker on NAS, serves OpenAI-compatible API on port 11434

---

## Per-User Endpoints

Ollama endpoints are configured **per-user** via the UI — no server-wide env vars needed.

### How it works

1. Users add their Ollama endpoints in **Settings > Benchmark Endpoints** (the same endpoints used by the Model Benchmark feature)
2. Each endpoint stores: `url`, `name`, optional `cfAccessClientId`, `cfAccessClientSecret`
3. When AI Chat sends a message, the backend reads the user's selected endpoint from Firestore
4. If the user has no endpoints, Gemini is used as the fallback (if `GEMINI_API_KEY` is configured)

### Firestore structure

```
users/{uid}/benchmarkEndpoints/{endpointId}
├── url: "https://ollama.mycircledash.com"
├── name: "NAS Ollama"
├── cfAccessClientId: "xxx.access"     (optional)
├── cfAccessClientSecret: "xxxxxxxx"   (optional)
└── createdAt: "2026-01-15T..."
```

### GraphQL

```graphql
# AI Chat uses endpointId to select which Ollama endpoint
mutation AiChat($message: String!, ..., $endpointId: ID) {
  aiChat(message: $message, ..., endpointId: $endpointId) { ... }
}

# Discover models on a specific endpoint
query GetBenchmarkEndpointModels($endpointId: ID!) {
  benchmarkEndpointModels(endpointId: $endpointId)
}
```

### Code locations

| File | Role |
|------|------|
| `functions/src/resolvers.ts` | `getUserOllamaEndpoint()` helper + GraphQL resolvers |
| `functions/src/index.ts` | Standalone `aiChat` REST endpoint |
| `server/graphql/resolvers.ts` | Dev server resolvers (uses `OLLAMA_BASE_URL` env var for local dev) |
| `packages/ai-assistant/src/components/AiAssistant.tsx` | Endpoint + model selector UI |
| `packages/ai-assistant/src/hooks/useAiChat.ts` | Passes `endpointId` in mutation |
| `packages/model-benchmark/src/components/BenchmarkRunner.tsx` | Model discovery dropdown |

---

## NAS Docker Setup

### docker-compose.yml

> **Ready-to-use file**: [`deploy/ollama/docker-compose.yml`](../deploy/ollama/docker-compose.yml)

```yaml
version: "3.8"

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - /volume1/docker/ollama/models:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_NUM_PARALLEL=1
      - OLLAMA_MAX_LOADED_MODELS=1
    deploy:
      resources:
        limits:
          memory: 6G

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=<your-tunnel-token>
    depends_on:
      - ollama
```

**Important**: Both containers must be in the same `docker-compose.yml` so they share a Docker network. The `cloudflared` container reaches Ollama via the service name `ollama` (not `localhost`).

### Pull a model

```bash
docker exec ollama ollama pull gemma3:4b
```

### Available Models

Pick a model based on your machine's available RAM/VRAM. All numbers below are for **Q4_K_M** quantization (recommended sweet spot for quality vs memory).

#### Lightweight (4–8 GB RAM) — Good for NAS, Raspberry Pi 5, old laptops

| Model | Params | RAM needed | Tool calling | Best for |
|-------|--------|-----------|--------------|----------|
| `gemma3:1b` | 1B | ~2 GB | No | Fastest responses, simple Q&A |
| `gemma2:2b` | 2B | ~3 GB | No (prompt fallback) | Current default, low resource baseline |
| `llama3.2:3b` | 3B | ~3.6 GB | Yes (native) | Lightweight with tool support |
| `gemma3:4b` | 4B | ~4 GB | No | Best quality-per-GB ratio |
| `qwen3:4b` | 4B | ~4 GB | Yes (native) | Multilingual + tools, thinking mode |
| `phi3:3.8b` | 3.8B | ~4 GB | No | Strong reasoning for its size |

#### Mid-range (8–16 GB RAM) — Desktops, gaming PCs, Mac M1/M2

| Model | Params | RAM needed | Tool calling | Best for |
|-------|--------|-----------|--------------|----------|
| `llama3.1:8b` | 8B | ~6.2 GB | Yes (native) | General purpose, great tool support |
| `qwen3:8b` | 8B | ~6.5 GB | Yes (native) | Beats llama3.1:8b on most benchmarks |
| `mistral:7b` | 7B | ~6 GB | Yes (native) | Fast, good for European languages |
| `gemma3:12b` | 12B | ~12.4 GB | No | High quality, Google's latest |
| `qwen3:14b` | 14B | ~10.7 GB | Yes (native) | Best 14B model, strong reasoning |
| `phi4:14b` | 14B | ~11 GB | No | Microsoft's reasoning model |
| `deepseek-r1:14b` | 14B | ~11 GB | No | Chain-of-thought reasoning |

#### High-end (16–32 GB RAM) — Workstations, Mac M2 Pro/Max, GPU servers

| Model | Params | RAM needed | Tool calling | Best for |
|-------|--------|-----------|--------------|----------|
| `gemma3:27b` | 27B | ~22.5 GB | No | Near-GPT-4 quality on many tasks |
| `qwen3:32b` | 32B | ~22.2 GB | Yes (native) | Best open model under 32B, tools + thinking |
| `command-r:35b` | 35B | ~24 GB | Yes (native) | Built for RAG and tool use |

#### Workstation (48+ GB RAM/VRAM) — Dual GPU, cloud instances

| Model | Params | RAM needed | Tool calling | Best for |
|-------|--------|-----------|--------------|----------|
| `llama3.3:70b` | 70B | ~45.6 GB | Yes (native) | Near-frontier quality |
| `qwen2.5:72b` | 72B | ~50.5 GB | Yes (native) | Best open-weight large model |

### Recommendations for MyCircle

| Scenario | Recommended model | Why |
|----------|------------------|-----|
| **NAS / low-power device** | `qwen3:4b` | Smallest model with native tool calling (weather, stocks, crypto tools work) |
| **Desktop / 16 GB Mac** | `qwen3:8b` | Best balance of speed, quality, and tool support |
| **Beefy machine / GPU** | `qwen3:14b` or `qwen3:32b` | Top-tier quality with full tool calling |
| **Benchmarking / comparison** | Pull 2-3 different sizes | e.g., `qwen3:4b` + `qwen3:8b` + `gemma3:12b` |
| **Code assistance** | `qwen2.5-coder:7b` | Specialized for code generation |

> **Tool calling matters for MyCircle**: Models with native tool calling can use weather, stock, crypto, and navigation tools automatically. Models without it fall back to a prompt-based approach (works but less reliable). The `qwen3` family is recommended because it has native tool support at every size.

### Pull multiple models for benchmarking

```bash
docker exec ollama ollama pull qwen3:4b
docker exec ollama ollama pull qwen3:8b
docker exec ollama ollama pull gemma3:12b
```

Models are auto-discovered — after pulling, they appear in the AI Chat model dropdown and Benchmark model selector immediately.

### Verify locally

```bash
curl http://localhost:11434/v1/models
# Should list all pulled models
```

---

## Cloudflare Tunnel (Permanent Domain)

### 1. Create the tunnel

In [Cloudflare Zero Trust](https://one.dash.cloudflare.com/):
1. Go to **Networks** > **Tunnels** > **Create a tunnel**
2. Name: `nas_ollama`
3. Copy the **Tunnel Token** and put it in your `docker-compose.yml`

### 2. Configure public hostname

In the tunnel settings > **Public Hostname**:
- **Subdomain**: `ollama`
- **Domain**: `mycircledash.com`
- **Service**: `http://ollama:11434`

> **Critical**: Use `http://ollama:11434` (Docker service name), NOT `http://localhost:11434`.

---

## Cloudflare WAF (Skip Bot Challenge)

Cloudflare's **Bot Fight Mode** issues JavaScript challenges to non-browser requests. You must create a WAF rule to skip challenges for the Ollama subdomain.

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **mycircledash.com** → **Security** → **WAF**
2. Click **Custom rules** → **Create rule**
3. Fill in:
   - **Rule name**: `Skip bot challenge for Ollama`
   - **Field**: `Hostname` — **Operator**: `equals` — **Value**: `ollama.mycircledash.com`
   - **Action**: `Skip`
   - Check all: **All remaining custom rules**, **All rate limiting rules**, **All managed rules**, **All Super Bot Fight Mode Rules**
4. Deploy

---

## Cloudflare Access (Service Token Auth)

When adding an endpoint in the UI, you can optionally provide Cloudflare Access credentials (`cfAccessClientId`, `cfAccessClientSecret`). These are stored per-endpoint in Firestore and sent as headers when calling the Ollama API.

### 1. Create a Service Token

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) > **Access controls** > **Service credentials**
2. Click **Create Service Token**
3. Name: `mycircle-ollama`
4. Duration: **Non-expiring**
5. Copy both values — enter them when adding the endpoint in MyCircle Settings

### 2. Create an Access Application

1. **Access controls** > **Applications** > **Add an application** > **Self-hosted**
2. Fill in:
   - **Application name**: `Ollama API`
   - **Session Duration**: 24 hours
   - **Public hostname**: Subdomain `ollama`, Domain `mycircledash.com`

### 3. Add a Service Auth policy

1. Click **Add a policy**
2. **Policy name**: `MyCircle Service Auth`
3. **Action**: **Service Auth** (NOT "Allow" or "Bypass")
4. **Include** > Selector: **Service Token** > Value: your token

---

## Quick Setup (Free Tunnel, No Domain Needed)

If you don't have a Cloudflare account or custom domain, you can use Cloudflare's **free quick tunnel** to expose Ollama instantly. The URL is temporary (changes on every container restart), but MyCircle's Endpoint Manager UI makes it easy to update.

### 1. docker-compose.quick.yml

> **Ready-to-use file**: [`deploy/ollama/docker-compose.quick.yml`](../deploy/ollama/docker-compose.quick.yml)

```yaml
version: "3.8"

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ./ollama-models:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    deploy:
      resources:
        limits:
          memory: 6G

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --url http://ollama:11434
    depends_on:
      - ollama
```

### 2. Start and pull a model

```bash
docker compose up -d
docker exec ollama ollama pull qwen3:4b
```

### 3. Get your tunnel URL

```bash
docker logs cloudflared 2>&1 | grep "trycloudflare.com"
# Example output: https://random-words-here.trycloudflare.com
```

The URL looks like `https://some-random-words.trycloudflare.com`. Copy it.

### 4. Add the endpoint in MyCircle

1. Open MyCircle and go to **AI Chat** > **Endpoints** tab
2. Click **Add Endpoint**
3. Paste the `*.trycloudflare.com` URL as the endpoint URL
4. Give it a name (e.g., "My Laptop", "Home Server")
5. Leave CF Access fields empty (free tunnels don't need auth)
6. Save — models are auto-discovered and appear in the model dropdown

### 5. Use it

Switch to the **Chat** tab, select your endpoint and model from the dropdowns, and start chatting. You can also use the **Model Benchmark** page to compare performance across endpoints.

> **URL changes on restart**: Free tunnels generate a new URL each time `cloudflared` restarts. When that happens, edit the endpoint in the Endpoints tab and update the URL. Everything else (name, chat history) stays the same.

> **No WAF or Access config needed**: Free tunnels bypass Cloudflare's Bot Fight Mode and don't require Access policies. The tradeoff is no authentication — anyone with the URL can reach your Ollama instance (the URL is random and hard to guess, but not secret).

---

## Apple Silicon Mac Setup

Docker Desktop on macOS runs a Linux VM that **cannot access Apple Metal GPU**. You have two options: everything in Docker (CPU-only, simpler) or native Ollama with a Docker tunnel (Metal GPU, faster).

### Option A: Everything in Docker (CPU-only)

Simpler setup but slower — Ollama runs on CPU only inside the Docker VM.

> **Ready-to-use file**: [`deploy/ollama/docker-compose.macpro.yml`](../deploy/ollama/docker-compose.macpro.yml)

**Tuned for Apple M3 Pro (11 cores, 18GB unified RAM):**

| Setting | Value | Why |
|---------|-------|-----|
| `OLLAMA_NUM_PARALLEL` | 4 | 11 cores / ~2.5 — leaves headroom for macOS |
| `OLLAMA_MAX_LOADED_MODELS` | 1 | 12GB Docker limit — keep 1 model hot to avoid OOM |
| `memory` | 12G | 18GB total minus ~6GB for macOS + Docker VM overhead |
| GPU reservation | None | Docker VM cannot access Metal |

```bash
cd deploy/ollama
docker compose -f docker-compose.macpro.yml up -d
docker exec ollama ollama pull qwen3:4b
docker logs cloudflared 2>&1 | grep "trycloudflare.com"
```

**Recommended models for CPU-only Docker (12GB limit):**

| Model | RAM needed | Speed | Notes |
|-------|-----------|-------|-------|
| `qwen3:4b` | ~2.5 GB | Good | Best balance of speed + tool calling |
| `llama3.2:3b` | ~2.0 GB | Good | Fast, good quality |
| `gemma2:2b` | ~1.6 GB | Fastest | Lightweight |
| `llama3.1:8b` | ~4.7 GB | Slow | Largest practical size on CPU |

Avoid 27B+ models — they won't fit in 12GB and will swap or crash.

### Option B: Native Ollama + Docker Tunnel (Recommended)

Run Ollama directly on macOS for **full Metal GPU acceleration** (3-5x faster than CPU-only Docker). Only use Docker for the Cloudflare tunnel.

> **Ready-to-use file**: [`deploy/ollama/docker-compose.macpro-native.yml`](../deploy/ollama/docker-compose.macpro-native.yml)

**How it connects:**

```
Browser → Cloudflare CDN → trycloudflare.com tunnel
    → Docker cloudflared container
    → host.docker.internal:11434  (Docker DNS for the Mac host)
    → native Ollama with Metal GPU
```

`host.docker.internal` is a special hostname Docker Desktop provides that lets containers reach services running on the Mac.

#### Step 1: Install and run Ollama natively

```bash
brew install ollama
ollama serve
```

#### Step 2: Pull a model (in a new terminal)

```bash
ollama pull qwen3:4b
curl http://localhost:11434/api/tags   # verify it works
```

With Metal GPU, you can run larger models than in Docker:

| Model | RAM needed | Viable on M3 Pro 18GB? |
|-------|-----------|----------------------|
| `qwen3:4b` | ~2.5 GB | Yes, fast |
| `llama3.1:8b` | ~4.7 GB | Yes, good speed |
| `qwen3:14b` | ~9 GB | Yes, usable |
| `gemma3:27b` | ~16 GB | Tight but possible |

#### Step 3: Start the tunnel

```bash
cd deploy/ollama
docker compose -f docker-compose.macpro-native.yml up -d
docker logs cloudflared 2>&1 | grep "trycloudflare.com"
```

#### Step 4: Add the endpoint in MyCircle

Same as [Quick Setup step 4](#4-add-the-endpoint-in-mycircle) — paste the `*.trycloudflare.com` URL in **AI Chat > Endpoints**.

### Compose file summary

| File | Hardware | GPU? | Use case |
|------|----------|------|----------|
| `docker-compose.yml` | NVIDIA Linux (permanent tunnel) | CUDA | Production server |
| `docker-compose.quick.yml` | NVIDIA Linux (free tunnel) | CUDA | Quick test on Linux |
| `docker-compose.macpro.yml` | Apple Silicon (all Docker) | No (CPU-only) | Simple Mac setup |
| `docker-compose.macpro-native.yml` | Apple Silicon (native + tunnel) | Metal | Best Mac performance |

### Adjusting for other Macs

The `macpro` files are tuned for M3 Pro 18GB. For other configurations:

| Your Mac | memory limit | NUM_PARALLEL | MAX_LOADED_MODELS | Notes |
|----------|-------------|--------------|-------------------|-------|
| M1/M2 8GB | 4G | 2 | 1 | Stick to 2B-4B models |
| M1/M2 16GB | 10G | 3 | 1 | 8B models work well |
| M3 Pro 18GB | 12G | 4 | 1 | Current defaults |
| M2/M3 Pro 32GB | 24G | 5 | 2 | Can run 14B comfortably |
| M2/M3 Max 64GB | 48G | 6 | 3 | 32B+ models viable |

---

## Provider Priority

1. If user has configured Ollama endpoints → **Ollama** (using selected endpoint)
2. If no endpoints but `GEMINI_API_KEY` is set → **Gemini** (fallback)
3. If neither → AI chat returns an error

---

## Tool Calling

### Native tool calling (qwen2.5, llama3.1+, mistral)

Models with native OpenAI-compatible tool support use the `tools` parameter directly.

### Prompt-based fallback (gemma2:2b, other simple models)

For models without native tool support:
1. Tool descriptions are injected into the system prompt
2. The model outputs `<tool_call>{"name":"...","args":{...}}</tool_call>`
3. Parsed with regex, tool executed, results sent back for final answer

The fallback is automatic — if the native `tools` API call throws, the system retries with the prompt-based approach.

### Available tools (16)

| Tool | Category | Description |
|------|----------|-------------|
| `getWeather` | Weather | Get current weather for a city |
| `searchCities` | City search | Search for cities by name |
| `getStockQuote` | Stocks | Get stock quote by ticker symbol |
| `getCryptoPrices` | Crypto | Get cryptocurrency prices (CoinGecko, 2-min cache) |
| `navigateTo` | Navigation | Navigate to an app page (frontend action) |
| `getBibleVerse` | Bible | Look up a Bible verse or passage |
| `searchPodcasts` | Podcasts | Search for podcasts by keyword |
| `addFlashcard` | Flashcards | Create a flashcard (frontend action) |
| `listFlashcards` | Flashcards | List existing flashcards |
| `addBookmark` | Bible | Bookmark a Bible passage (frontend action) |
| `checkCaseStatus` | Immigration | Check USCIS case status |
| `addNote` | Notebook | Create a note |
| `addWorkEntry` | Work log | Log a work entry |
| `setBabyDueDate` | Baby tracker | Set a baby due date |
| `addChildMilestone` | Baby tracker | Record a child milestone |
| `addImmigrationCase` | Immigration | Add an immigration case to track |

Tool definitions are shared between the MCP server and Gemini/Ollama backends via `scripts/mcp-tools/mfe-tools.ts`.

---

## Troubleshooting

### "No AI provider configured"
**Cause**: User has no Ollama endpoints and `GEMINI_API_KEY` is not set.
**Fix**: Add an Ollama endpoint in Settings > Benchmark Endpoints, or ask admin to configure `GEMINI_API_KEY`.

### "403 Your request was blocked" (from Ollama)
**Cause**: Cloudflare Access is blocking requests because service token headers are missing or incorrect.
**Fix**: Edit the endpoint in Settings and verify the CF Access Client ID and Secret are correct.

### "Connection error."
**Cause 1**: Ollama container is stopped. **Fix**: `docker start ollama` on the NAS.
**Cause 2**: Cloudflare Tunnel routing to `localhost:11434` instead of `ollama:11434`. **Fix**: Update tunnel public hostname service URL.

### "ERR_PNPM_OUTDATED_LOCKFILE" during deploy
**Cause**: Stale `pnpm-lock.yaml` in the `functions/` directory.
**Fix**: Delete `functions/pnpm-lock.yaml`. The `functions/` dir uses npm.
