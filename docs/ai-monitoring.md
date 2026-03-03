# AI Chat Monitoring

The AI assistant tracks every chat interaction in Firestore (`aiChatLogs` collection) and exposes the data through the Monitor tab.

## What's Tracked

Each AI chat interaction logs:

| Field | Description |
|---|---|
| `provider` | `ollama` or `gemini` |
| `model` | Model name (e.g., `gemma2:2b`, `gemini-2.5-flash`) |
| `endpointId` | Ollama endpoint ID (correlates with benchmark endpoints) |
| `inputTokens` / `outputTokens` | Token usage |
| `latencyMs` | End-to-end response time |
| `toolCalls` | Tools invoked (name, duration, errors) |
| `questionPreview` | Truncated user message (200 chars) |
| `answerPreview` | Truncated AI response (500 chars) |
| `fullQuestion` | Full untruncated user message (up to 5,000 chars) |
| `fullAnswer` | Full untruncated AI response (up to 10,000 chars) |
| `status` | `success` or `error` |
| `usedFallback` | Whether prompt-based tool fallback was used |

## Accessing the Monitor

1. Navigate to the **AI Assistant** page
2. Click the **Monitor** tab
3. View:
   - **Usage Stats** - total calls, tokens, latency, error rate
   - **Charts** - calls per day, latency trends
   - **Ollama Status** - online/offline, running models, VRAM
   - **Recent Logs** - individual chat interactions

## Viewing Full Raw Data

In the Recent Logs section:

1. Click any log entry to expand it
2. Click **"Show full"** to toggle between truncated preview and full raw content
3. The full question and answer are shown untruncated
4. The endpoint ID is displayed when available

## Correlating with Benchmarks

AI chat logs include the `endpointId` field, which matches the endpoint IDs in the benchmark system. This lets you:

- See which Ollama endpoint was used for each chat
- Compare chat performance vs benchmark results for the same endpoint/model
- Both systems share the same endpoint configuration (managed in the Endpoints tab)

## Firestore Queries

To query raw data directly in the Firebase console:

```
Collection: aiChatLogs
Order by: timestamp (desc)
```

Filter examples:
- By provider: `provider == "ollama"`
- By endpoint: `endpointId == "<endpoint-id>"`
- By status: `status == "error"`
- By date: `timestamp >= <date>`

## Data Retention

Logs are kept indefinitely in Firestore. The monitor UI shows the last 7 days by default (configurable via the `days` parameter). Recent logs show the last 20 entries (up to 50).
