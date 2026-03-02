# Ollama Self-Hosted AI Setup Guide

Complete guide for running AI chat with Ollama on your own hardware instead of Google Gemini.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Per-User Endpoints](#per-user-endpoints)
- [NAS Docker Setup](#nas-docker-setup)
- [Cloudflare Tunnel (Permanent Domain)](#cloudflare-tunnel-permanent-domain)
- [Cloudflare Access (Service Token Auth)](#cloudflare-access-service-token-auth)
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

### Pull the model

```bash
docker exec ollama ollama pull gemma2:2b
```

### Verify locally

```bash
curl http://localhost:11434/v1/models
# Should return: {"object":"list","data":[{"id":"gemma2:2b",...}]}
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
