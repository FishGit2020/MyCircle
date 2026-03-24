# Feature Specification: AI Benchmark Enhancements

**Feature Branch**: `013-ai-benchmark`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "Benchmark AI model endpoints for latency and quality comparison check existed MFE, add new features"

## Overview

The Model Benchmark MFE already supports single-prompt benchmarking across multiple Ollama endpoints, AI-judge quality scoring, history tracking, and endpoint management. This feature adds new capabilities to enable deeper, multi-dimensional performance analysis: batch multi-prompt runs, visual side-by-side comparison charts, and historical trend tracking over time.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Prompt Batch Benchmarking (Priority: P1)

A user managing multiple Ollama deployments wants to evaluate a model comprehensively, not just against a single question. Today they must click "Run" five separate times — once per built-in prompt — to get a full picture. With batch mode they select all prompts at once, click Run once, and receive a consolidated result set covering all prompt categories (factual, reasoning, code, summarisation, creative).

**Why this priority**: This is the highest-value gap in the current experience. A single-prompt result is too narrow to trust as a benchmark; multi-prompt coverage makes the result actionable. It directly addresses the "latency and quality comparison" need in the feature description.

**Independent Test**: Can be fully tested by running a benchmark with 3 endpoints selected and all 5 preset prompts checked, verifying that 15 results (3 × 5) appear in the Results tab with individual timing and quality scores per prompt.

**Acceptance Scenarios**:

1. **Given** the Run tab is open and multiple endpoints are selected, **When** the user enables "All Prompts" batch mode and clicks Run, **Then** the system runs every preset prompt against every selected endpoint sequentially and displays all results grouped by prompt.
2. **Given** a batch run is in progress, **When** the user views the Run tab, **Then** a progress indicator shows which endpoint/prompt combination is currently being evaluated (e.g., "Endpoint 2/3 — Prompt 3/5").
3. **Given** a batch run completes, **When** the results are saved to history, **Then** the history entry shows the multi-prompt summary (total result count, overall fastest, average quality score) and can be expanded to view per-prompt breakdowns.
4. **Given** the batch mode is active, **When** a single endpoint errors on one prompt, **Then** the run continues for remaining prompts/endpoints and the error is shown inline for that specific combination only.

---

### User Story 2 - Visual Side-by-Side Comparison Charts (Priority: P2)

After running a benchmark across 3–5 endpoints, the user looks at a table of numbers (tok/s, TTFT, quality score) and struggles to form a quick mental ranking. A bar-chart view lets them see instantly which endpoint wins on speed, which wins on quality, and whether the trade-offs are significant.

**Why this priority**: The current Results tab is text-only. Visual comparison is the standard for performance dashboards and dramatically reduces time-to-insight. It does not require backend changes, making it self-contained.

**Independent Test**: Can be fully tested after a benchmark run with at least 2 endpoints by opening the Results tab and switching to Chart view, confirming bars are shown for tok/s and quality score per endpoint/model.

**Acceptance Scenarios**:

1. **Given** a benchmark result contains 2 or more endpoint results, **When** the user clicks "Chart" view on the Results tab, **Then** a grouped bar chart displays tokens-per-second and quality score side by side for each endpoint/model.
2. **Given** the chart is displayed, **When** the user hovers or taps a bar, **Then** a tooltip shows the exact numeric value, endpoint name, and model name.
3. **Given** an endpoint result has an error (no timing data), **When** the chart renders, **Then** that endpoint is shown with an empty/zero bar and a distinct error indicator, not omitted entirely.
4. **Given** batch mode was used, **When** the chart view is open, **Then** the user can toggle between "By Prompt" and "By Endpoint" groupings to compare across both dimensions.

---

### User Story 3 - Historical Performance Trend View (Priority: P3)

A user who has been benchmarking the same Ollama server weekly wants to know whether a model update improved or degraded throughput. They need a trend line across saved runs, filtered to a specific endpoint/model pair, showing tok/s and quality score over time.

**Why this priority**: Trend analysis is only useful once history accumulates. It depends on the existing history feature and requires no new backend mutations — it is read-only aggregation of existing saved runs. P3 because it delivers value incrementally as data builds up.

**Independent Test**: Can be fully tested by navigating to the History tab, selecting a specific endpoint/model filter, and confirming a line chart appears plotting the last 10 runs for that combination by date.

**Acceptance Scenarios**:

1. **Given** at least 2 saved benchmark runs contain results for the same endpoint+model combination, **When** the user opens the History tab and selects that endpoint+model from the filter, **Then** a line chart appears showing tok/s and quality score over run dates.
2. **Given** the trend chart is displayed, **When** the user hovers a data point, **Then** a tooltip shows the exact run date, tok/s value, and quality score.
3. **Given** the filter is set to "All", **When** the trend chart renders, **Then** each unique endpoint/model combination is shown as a separate line with a distinct colour.
4. **Given** a run in the series had an error for the selected model, **When** the chart renders, **Then** that data point is shown as a gap or distinct error marker rather than a zero, to avoid misleading downward spikes.

---

### Edge Cases

- What happens when only 1 endpoint is selected for a batch run? → Batch still runs all prompts against that single endpoint; chart view shows a single-bar group.
- What happens when the judge model is unavailable during batch scoring? → Results are saved without quality scores; a warning banner indicates scoring was skipped; the batch is not aborted.
- What happens when history contains runs with no timing data (error-only runs)? → Trend chart excludes those runs or shows them as gaps; they do not skew the scale.
- What happens when a prompt produces an extremely long response, slowing the run? → The per-combination progress indicator shows elapsed time; there is no forced timeout added by this feature (backend handles timeouts).
- What happens when the user navigates away during a batch run? → The run continues in the background (existing behaviour); returning to the Run tab shows the current progress.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Run tab MUST allow users to select multiple prompts (including "All") in addition to the existing single-prompt selection.
- **FR-002**: When batch mode is active, the system MUST execute the benchmark for each selected prompt × each selected endpoint combination sequentially.
- **FR-003**: During a batch run, the system MUST display real-time progress showing the current endpoint name and prompt number out of total (e.g., "Endpoint 2/3 · Prompt 3/5").
- **FR-004**: Batch run results MUST be grouped by prompt category in the Results tab view.
- **FR-005**: The Results tab MUST offer a Chart view toggle alongside the existing list view.
- **FR-006**: The Chart view MUST render a grouped bar chart showing tokens-per-second and quality score per endpoint/model.
- **FR-007**: Chart bars MUST be interactive — displaying a tooltip with endpoint name, model, and exact metric values on hover or tap.
- **FR-008**: For batch results, the Chart view MUST support switching between "By Endpoint" and "By Prompt" grouping dimensions.
- **FR-009**: The History tab MUST include an endpoint/model filter dropdown that limits the trend chart to a selected combination.
- **FR-010**: When filtered, the History tab MUST render a line chart plotting tok/s and quality score across run dates for the selected combination.
- **FR-011**: The trend chart MUST render each unique endpoint/model as a distinct line with its own colour when the "All" filter is active.
- **FR-012**: Error data points in the trend chart MUST be shown as gaps or distinct markers — not as zero values.
- **FR-013**: Batch runs MUST be saved to history as a single run record containing all prompt × endpoint results, consistent with the existing save behaviour.
- **FR-014**: All new UI strings MUST be present in all 3 locale files (en, es, zh).

### Key Entities *(include if feature involves data)*

- **Benchmark Run**: An existing saved record of one benchmark execution. Extended to support `results[]` entries that now carry a `promptId` field identifying which prompt produced that result.
- **Batch Result Group**: A client-side grouping of `BenchmarkRunResult` records sharing the same `promptId`, used to render per-prompt sections in Results and per-prompt bars in charts.
- **Trend Series**: A client-side aggregation of historical `BenchmarkRunResult` entries for a specific endpoint+model pair, ordered by run timestamp, used to plot the line chart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can benchmark 3 endpoints × 5 prompts (15 combinations) in a single run without manual re-triggering — completing the full batch run from start to saved history in under 5 minutes on typical hardware.
- **SC-002**: After a batch run, users can identify the fastest endpoint visually within 10 seconds by switching to Chart view — without reading raw numbers.
- **SC-003**: Users with at least 5 saved runs for the same model can view a trend line showing performance change over time in the History tab with no additional setup steps.
- **SC-004**: 100% of new visible UI strings render correctly in English, Spanish, and Chinese locale without falling back to key names.
- **SC-005**: All new UI interactions (chart toggle, batch mode toggle, trend filter) are accessible via keyboard and meet the existing touch-target size requirements.

## Assumptions

- The existing `BenchmarkRunResult` data model is extended to include an optional `promptId` field. Historical runs without `promptId` (single-prompt runs) remain fully compatible and are treated as a single-prompt result in chart and trend views.
- Charts are rendered using SVG (inline, no new charting library dependency) consistent with the existing codebase pattern of hand-rolled SVG charts in `MonitorCharts.tsx`.
- Batch scoring (calling the judge model per result) runs sequentially after all endpoints/prompts complete, consistent with the existing single-prompt scoring flow.
- No new Firestore collections or GraphQL mutations are required; the existing `saveBenchmarkRun` mutation accepts the expanded results array as-is via the `JSON` type.
- The trend chart is a read-only view built from the existing `GET_BENCHMARK_HISTORY` query; no new backend query is needed.
