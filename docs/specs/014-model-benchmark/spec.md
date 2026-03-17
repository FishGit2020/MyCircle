# Feature Spec: Model Benchmark

**Status**: Implemented
**Package**: `packages/model-benchmark`
**Route**: `/benchmark`
**Port**: 3004

## Summary

AI model performance comparison tool for benchmarking Ollama endpoints. Supports multiple endpoint management, benchmark execution with configurable prompts, run history tracking, and a results dashboard for analyzing model performance across different configurations.

## Key Features

- Endpoint manager: add, edit, delete Ollama endpoint URLs
- Benchmark runner: execute prompts against selected models/endpoints
- Results dashboard with performance metrics (tokens/sec, latency, total time)
- Benchmark history with run comparison
- Multi-model comparison within a single benchmark run
- Configurable test prompts and parameters

## Data Sources

- **Ollama API**: `/api/generate` endpoint for model inference
- **Firestore**: `users/{uid}/benchmarkEndpoints/{endpointId}` (saved endpoints)
- **Firestore**: `users/{uid}/benchmarkRuns/{runId}` (benchmark history)
- **GraphQL**: `GET_BENCHMARK_ENDPOINTS`, `GET_BENCHMARK_ENDPOINT_MODELS`

## Integration Points

- **Shell route**: `/benchmark` in App.tsx (requires auth)
- **Widget**: `benchmark` in widgetConfig.ts
- **Nav group**: Learning (`nav.group.learning`)
- **i18n namespace**: `nav.benchmark`, `benchmark.*`
- **Firestore**: `users/{uid}/benchmarkEndpoints`, `users/{uid}/benchmarkRuns`
- **Shared with AI Assistant**: Endpoints are shared via GraphQL queries

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Ollama REST API for model inference
- Firestore for endpoint and run persistence
- Custom hooks for benchmark execution and data
- Results visualization dashboard

## Testing

- Unit tests: `packages/model-benchmark/src/**/*.test.{ts,tsx}`
- E2E: `e2e/model-benchmark.spec.ts`
