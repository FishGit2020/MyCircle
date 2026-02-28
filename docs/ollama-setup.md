# Ollama Self-Hosted AI Setup Guide

Complete guide for running AI chat with Ollama on your own hardware instead of Google Gemini.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [NAS Docker Setup](#nas-docker-setup)
- [Cloudflare Tunnel (Permanent Domain)](#cloudflare-tunnel-permanent-domain)
- [Cloudflare Access (Service Token Auth)](#cloudflare-access-service-token-auth)
- [Firebase Secrets](#firebase-secrets)
- [Cloud Functions Configuration](#cloud-functions-configuration)
- [Tool Calling](#tool-calling)
- [Provider Priority](#provider-priority)
- [Troubleshooting](#troubleshooting)
- [All Secrets Reference](#all-secrets-reference)

---

## Architecture Overview

```
Browser (mycircledash.com)
   │
   │  GraphQL mutation (AiChat)
   ▼
Firebase Cloud Functions (graphql)
   │
   │  OpenAI-compatible API + CF Access headers
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
- **Frontend**: Apollo Client `useMutation(AI_CHAT)` → GraphQL endpoint
- **Cloud Function**: `graphql` function with `aiChat` mutation resolver in `functions/src/resolvers.ts`
- **Cloudflare Access**: Validates `CF-Access-Client-Id` + `CF-Access-Client-Secret` headers
- **Cloudflare Tunnel**: Routes `ollama.mycircledash.com` → `http://ollama:11434` (Docker service name)
- **Ollama**: Runs in Docker on NAS, serves OpenAI-compatible API on port 11434

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

> **Critical**: Use `http://ollama:11434` (Docker service name), NOT `http://localhost:11434`. Inside the cloudflared container, `localhost` refers to itself, not the host machine.

### 3. DNS record

Cloudflare automatically creates a `Tunnel` type DNS record:
- **Name**: `ollama`
- **Type**: Tunnel
- **Content**: `nas_ollama`
- **Proxy status**: Proxied (orange cloud)

---

## Cloudflare WAF (Skip Bot Challenge)

Cloudflare's **Bot Fight Mode** issues JavaScript challenges to non-browser requests. This blocks the OpenAI SDK from reaching Ollama. You must create a WAF rule to skip challenges for the Ollama subdomain.

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **mycircledash.com** → **Security** → **WAF**
2. Click **Custom rules** → **Create rule**
3. Fill in:
   - **Rule name**: `Skip bot challenge for Ollama`
   - **Field**: `Hostname` — **Operator**: `equals` — **Value**: `ollama.mycircledash.com`
   - **Action**: `Skip`
   - Check all: **All remaining custom rules**, **All rate limiting rules**, **All managed rules**, **All Super Bot Fight Mode Rules**
4. Deploy

> **Why**: Bot Fight Mode runs BEFORE Cloudflare Access. Even with valid service token headers, the SDK request gets a JavaScript challenge (403 with HTML page). The WAF skip rule lets Access handle authentication instead.

---

## Cloudflare Access (Service Token Auth)

Cloudflare Access protects the Ollama endpoint from unauthorized access. Cloud Functions authenticates using a **Service Token**.

### 1. Create a Service Token

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) > **Access controls** > **Service credentials**
2. Click **Create Service Token**
3. Name: `cloud-functions`
4. Duration: **Non-expiring** (Cloud Functions needs continuous access)
5. **Copy both values immediately** (secret is only shown once!):
   - `CF-Access-Client-Id`: `xxxxxxxx.access`
   - `CF-Access-Client-Secret`: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Create an Access Application

1. **Access controls** > **Applications** > **Add an application** > **Self-hosted**
2. Fill in:
   - **Application name**: `Ollama API`
   - **Session Duration**: 24 hours
   - **Public hostname**: Subdomain `ollama`, Domain `mycircledash.com`

### 3. Add a Service Auth policy

On the application's **Policies** tab:
1. Click **Add a policy** (create it directly on the application, not as a reusable policy)
2. Fill in:
   - **Policy name**: `Cloud Functions Service Auth`
   - **Action**: **Service Auth** (NOT "Allow" or "Bypass")
   - **Include** > Selector: **Service Token** > Value: `cloud-functions`
3. Save

> **Common mistake**: Creating a reusable policy but forgetting to assign it to the application. The application's "Policies assigned" count must be > 0.

### 4. Test the service token

```bash
curl -H "CF-Access-Client-Id: YOUR_CLIENT_ID" \
     -H "CF-Access-Client-Secret: YOUR_CLIENT_SECRET" \
     https://ollama.mycircledash.com/v1/models
```

Expected: `{"object":"list","data":[{"id":"gemma2:2b",...}]}`

If you get a 302 redirect to a login page, the policy is not matching. Check:
- Action is **Service Auth** (not Allow)
- The service token is selected in the Include rule
- The policy is assigned to the application (not just in the reusable policies list)

---

## Firebase Secrets

### Setting secrets

**Always use `printf`, never `echo`** — `echo` appends a trailing newline (`\n`) that corrupts URLs and tokens silently.

```bash
# Ollama endpoint
printf "https://ollama.mycircledash.com" | npx firebase functions:secrets:set OLLAMA_BASE_URL
printf "gemma2:2b" | npx firebase functions:secrets:set OLLAMA_MODEL

# Cloudflare Access credentials
printf "your-client-id.access" | npx firebase functions:secrets:set CF_ACCESS_CLIENT_ID
printf "your-client-secret" | npx firebase functions:secrets:set CF_ACCESS_CLIENT_SECRET

# Deploy to apply
firebase deploy --only functions
```

### Verifying secrets

```bash
# Check value (no trailing whitespace)
npx firebase functions:secrets:access OLLAMA_BASE_URL
npx firebase functions:secrets:access CF_ACCESS_CLIENT_ID

# Verify function has the secrets
gcloud functions describe graphql --region=us-central1 --gen2 \
  --format="value(serviceConfig.secretEnvironmentVariables)"
```

### Rotating secrets

If you create a new Cloudflare service token:
```bash
printf "new-client-id.access" | npx firebase functions:secrets:set CF_ACCESS_CLIENT_ID
printf "new-client-secret" | npx firebase functions:secrets:set CF_ACCESS_CLIENT_SECRET
firebase deploy --only functions
```

---

## Cloud Functions Configuration

### Secrets declaration

Both `graphql` and `aiChat` Cloud Functions must declare all AI-related secrets:

```ts
// functions/src/index.ts — graphql function
secrets: ['OPENWEATHER_API_KEY', 'FINNHUB_API_KEY', 'PODCASTINDEX_API_KEY',
          'PODCASTINDEX_API_SECRET', 'YOUVERSION_APP_KEY', 'GEMINI_API_KEY',
          'OLLAMA_BASE_URL', 'OLLAMA_MODEL',
          'CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET']
```

> **Critical**: Firebase secrets are per-function, not global. If a secret is missing from the declaration, it's `undefined` at runtime even if it exists in Secret Manager.

### OpenAI client with Cloudflare headers

```ts
const client = new OpenAI({
  baseURL: `${ollamaBaseUrl}/v1`,
  apiKey: 'ollama',
  defaultHeaders: {
    ...(process.env.CF_ACCESS_CLIENT_ID
      ? { 'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID } : {}),
    ...(process.env.CF_ACCESS_CLIENT_SECRET
      ? { 'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET } : {}),
  },
});
```

### Code locations

| File | Role |
|------|------|
| `functions/src/resolvers.ts` | GraphQL `aiChat` mutation resolver (production) |
| `functions/src/index.ts` | Standalone `aiChat` REST endpoint + `graphql` function config |
| `server/graphql/resolvers.ts` | Dev server `aiChat` resolver (local development) |
| `scripts/mcp-tools/openai-bridge.ts` | Zod → OpenAI tool format converter |
| `scripts/mcp-tools/gemini-bridge.ts` | Zod → Gemini tool format converter |
| `scripts/mcp-tools/mfe-tools.ts` | Shared tool definitions (Zod schemas) |

---

## Tool Calling

### Native tool calling (qwen2.5, llama3.1+, mistral)

Models with native OpenAI-compatible tool support use the `tools` parameter directly. The model returns structured `tool_calls` in the response.

### Prompt-based fallback (gemma2:2b, other simple models)

For models without native tool support:
1. Tool descriptions are injected into the system prompt
2. The model is instructed to output `<tool_call>{"name":"...","args":{...}}</tool_call>` when a tool is needed
3. The response text is parsed with regex for `<tool_call>` tags
4. If found, the tool is executed and results sent back for a final answer

The fallback is automatic — if the native `tools` API call throws, the system retries with the prompt-based approach.

### Available tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `getWeather` | Current weather for a city | `city: string` |
| `searchCities` | Search cities by name | `query: string` |
| `getStockQuote` | Stock price by symbol | `symbol: string` |
| `getCryptoPrices` | Top crypto prices | (none) |
| `navigateTo` | Navigate to an app page | `page: string` |

---

## Provider Priority

1. If `OLLAMA_BASE_URL` is set → **Ollama** is used (Gemini is ignored)
2. If only `GEMINI_API_KEY` is set → **Gemini** is used
3. If neither is set → AI chat returns an error

---

## Troubleshooting

### "No AI provider configured"
**Cause**: Neither `OLLAMA_BASE_URL` nor `GEMINI_API_KEY` is available to the function.
**Fix**: Check that the `graphql` function's `secrets` array includes `GEMINI_API_KEY`, `OLLAMA_BASE_URL`, and `OLLAMA_MODEL`. Redeploy after adding.

### "AI chat is handled by the dedicated /ai/chat Cloud Function endpoint"
**Cause**: The `functions/src/resolvers.ts` has a stub resolver instead of the real implementation.
**Fix**: The resolver was replaced with full Ollama + Gemini logic in PR #333. Ensure `functions/src/resolvers.ts` has the real `aiChat` mutation implementation, not a `throw new Error(...)` stub.

### "403 Your request was blocked" (from Ollama)
**Cause**: Cloudflare Access is blocking Cloud Functions requests because service token headers are missing or the policy isn't configured.
**Fix**:
1. Verify `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are in Firebase secrets
2. Verify the Cloudflare Access application has a **Service Auth** policy (not just Allow)
3. Verify the policy is assigned to the application (check "Policies assigned" count > 0)
4. Test with curl + headers from your NAS

### "403 App Check verification failed"
**Cause**: Firebase App Check reCAPTCHA token fails for `mycircledash.com` custom domain.
**Fix**: App Check is currently non-blocking (warn-only). To properly fix: add `mycircledash.com` to your reCAPTCHA Enterprise key's domain list in Google Cloud Console.

### "Connection error." (from GraphQL response)
**Cause 1**: Trailing newline in Firebase secrets. `echo "value"` appends `\n`.
**Fix**: Re-set secrets with `printf`: `printf "https://ollama.mycircledash.com" | npx firebase functions:secrets:set OLLAMA_BASE_URL`

**Cause 2**: Cloudflare Tunnel routing to `localhost:11434` instead of `ollama:11434`.
**Fix**: In Cloudflare Zero Trust > Tunnels > Public Hostname, change service URL to `http://ollama:11434` (Docker service name).

**Cause 3**: Ollama container is stopped.
**Fix**: `docker start ollama` on the NAS. Verify with `curl http://localhost:11434/v1/models`.

### "ERR_PNPM_OUTDATED_LOCKFILE" during deploy
**Cause**: Stale `pnpm-lock.yaml` in the `functions/` directory. Cloud Build detects it and uses pnpm instead of npm.
**Fix**: Delete `functions/pnpm-lock.yaml`. The `functions/` dir uses npm (`package-lock.json`).

### CI deploy overwrites manual deploy
**Cause**: The CI Deploy workflow runs on every merge to main, potentially overwriting a manual `firebase deploy`.
**Fix**: Always merge your code changes to main before deploying. The CI deploy uses the latest main code.

---

## All Secrets Reference

| Secret | Service | Purpose | Set with |
|--------|---------|---------|----------|
| `OLLAMA_BASE_URL` | Ollama | Endpoint URL (e.g., `https://ollama.mycircledash.com`) | `printf "url" \| npx firebase functions:secrets:set OLLAMA_BASE_URL` |
| `OLLAMA_MODEL` | Ollama | Model name (default: `gemma2:2b`) | `printf "gemma2:2b" \| npx firebase functions:secrets:set OLLAMA_MODEL` |
| `CF_ACCESS_CLIENT_ID` | Cloudflare | Service token Client ID | `printf "id.access" \| npx firebase functions:secrets:set CF_ACCESS_CLIENT_ID` |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare | Service token Client Secret | `printf "secret" \| npx firebase functions:secrets:set CF_ACCESS_CLIENT_SECRET` |
| `GEMINI_API_KEY` | Google | Gemini API key (fallback if no Ollama) | `printf "key" \| npx firebase functions:secrets:set GEMINI_API_KEY` |

### Functions that need these secrets

| Function | Secrets needed |
|----------|---------------|
| `graphql` | All 5 above + OPENWEATHER, FINNHUB, PODCASTINDEX, YOUVERSION |
| `aiChat` | All 5 above + OPENWEATHER, FINNHUB, RECAPTCHA |
