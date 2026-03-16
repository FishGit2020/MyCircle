# Feature Spec: AI Assistant

**Status**: Implemented
**Package**: `packages/ai-assistant`
**Route**: `/ai`
**Port**: 3007

## Summary

Context-aware AI chat assistant powered by Ollama (self-hosted) or Gemini, with streaming responses, 16 callable AI tools, voice input, and a built-in monitoring dashboard. The assistant can interact with other MFEs via tools (check weather, look up stocks, create notes, etc.).

## Key Features

- Streaming chat with Ollama or Gemini models
- 16 AI tools for cross-MFE actions (weather, stocks, crypto, navigation, flashcards, Bible, podcasts, notes, work entries, baby tracker, immigration, child dev)
- Voice input via Web Speech API
- Tool call display with real-time status
- Model and endpoint selection (supports multiple Ollama instances)
- Debug mode toggle for development
- AI monitoring dashboard (usage stats, recent logs, Ollama status)
- Thinking steps display for chain-of-thought models
- Abort/retry functionality
- Suggestion chips for common queries
- Chat history persisted in Firestore
- Markdown rendering in responses

## Data Sources

- **Cloud Function**: `/ai/chat` (standard), `/ai/chat/stream` (streaming)
- **GraphQL**: `GET_OLLAMA_MODELS`, `GET_BENCHMARK_ENDPOINTS`, `GET_BENCHMARK_ENDPOINT_MODELS`
- **Firestore**: Chat history (via Cloud Function)
- **localStorage**: Model selection, endpoint selection, debug mode, tool mode

## Integration Points

- **Shell route**: `/ai` in App.tsx (requires auth)
- **Widget**: `aiAssistant` in widgetConfig.ts
- **Nav group**: Learning (`nav.group.learning`)
- **i18n namespace**: `nav.ai`, `ai.*`
- **Cloud Function**: `/ai/**` -> `aiChat`, `/ai/chat/stream` -> `aiChatStream`
- **Firestore**: Chat sessions stored server-side

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Server-Sent Events (SSE) for streaming responses
- Web Speech API for voice input
- Custom hooks: `useAiChat`, `useAiChatStream`, `useAiChatWithStreaming`, `useTypewriter`
- Ollama API (self-hosted via Cloudflare tunnel)
- Gemini API fallback
- Lazy-loaded AiMonitor component

## Testing

- Unit tests: `packages/ai-assistant/src/**/*.test.{ts,tsx}`
- E2E: `e2e/ai-assistant.spec.ts`, `e2e/context-aware-ai.spec.ts`, `e2e/voice-input.spec.ts`
