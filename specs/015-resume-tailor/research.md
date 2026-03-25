# Research: Resume Tailor AI (015)

**Phase**: 0 — Pre-design research
**Date**: 2026-03-25

---

## Decision 1: AI Generation Pipeline — REST vs GraphQL

**Decision**: Use **GraphQL mutations** for all AI generation operations (`generateResume`, `boostAtsScore`).

**Rationale**: The existing `runBenchmark` mutation in `functions/src/resolvers/ai.ts` already demonstrates the pattern: a long-running GraphQL mutation (up to 300s timeout) that calls an external AI provider and returns structured JSON. The resume generation pipeline (~4–30 seconds, structured JSON output, no streaming) fits this pattern exactly. A REST endpoint would violate Constitution Principle III without justification.

**Alternatives considered**:
- REST endpoint like `aiChat` — rejected because `aiChat` requires REST specifically for SSE streaming; resume generation is batch/non-streaming, making REST unnecessary overhead
- Client-side AI calls — rejected because API keys must not be exposed to the browser

---

## Decision 2: PDF Generation — Server-Side vs Browser Print API

**Decision**: Use the **browser's native print API** (`window.print()`) with print-specific CSS (`@media print`), not `@react-pdf/renderer`.

**Rationale**: The reference app uses `@react-pdf/renderer` server-side for ATS-safe PDF output. In the MyCircle MFE context:
- Adding `@react-pdf/renderer` to `functions/` requires a new dependency and a binary REST endpoint
- A browser-based print-to-PDF approach requires zero new packages
- ATS safety is achievable via print CSS: standard fonts (Georgia/Times), no multi-column, no floats, forced single page via `@page { size: letter; margin: 0.5in; }` and `overflow: hidden`
- Users trigger "Save as PDF" from the system print dialog, which is the standard workflow for job seekers anyway

**Single-page enforcement**: The component uses a `useEffect` to measure rendered content height. If it overflows the 11in × 8.5in print viewport, lower-priority bullets are hidden (CSS class toggle, no AI call) until content fits. User can also manually toggle bullets.

**Alternatives considered**:
- `@react-pdf/renderer` server-side — rejected (new package + REST binary endpoint + no streaming, complexity not justified per Principle VI)
- `jsPDF` client-side — rejected (poor text rendering quality for ATS scanners, non-standard font handling)

---

## Decision 3: Resume File Upload & Parsing

**Decision**: **REST endpoint** (`/resume-tailor/upload`) for binary file upload, with server-side parsing using `mammoth` (DOCX) and `pdfjs-dist` (PDF).

**Rationale**: Binary file upload follows the established cloudFiles/babyPhotos pattern (base64 encode → POST → Cloud Function → Storage). Server-side parsing is required because:
- PDF parsing (pdfjs-dist) requires Node.js runtime
- DOCX parsing (mammoth) requires Node.js runtime
- Client-side parsing libraries are too large for MFE bundles

**New dependencies to add to `functions/package.json`**:
- `mammoth` — DOCX to plain text/HTML extraction
- `pdfjs-dist` — PDF text extraction (legacy build for Node.js)

**Note**: `cheerio` is already installed in `functions/` — used in the URL scraping resolver.

**Constitution compliance**: REST is acceptable here because (a) it handles binary data (file upload), which is the same justification as `cloudFiles` and `babyPhotos`, and (b) the actual data operations (fact bank CRUD, application log) go through GraphQL.

**Alternatives considered**:
- GraphQL mutation with base64 string input — rejected because large files (multiple MB PDFs) over GraphQL increase mutation payload size and Apollo's default body limits; the cloudFiles REST pattern is proven
- Client-side parsing only — rejected because PDF.js full build is ~3MB+ and DOCX parsing isn't available client-side in a usable form

---

## Decision 4: Fact Bank Storage — Firestore Document Structure

**Decision**: Store the fact bank as a **single Firestore document** at `users/{uid}/resumeFactBank/default`.

**Rationale**: The fact bank is always loaded as a complete unit (never paginated). A single document allows atomic updates and avoids collection overhead. The document payload is well within Firestore's 1MB document limit even for large resumes with many experiences.

**Experiences with versions**: The `versions` array is nested within each experience document. Per Firestore gotchas in CLAUDE.md, nested arrays within arrays (like `versions[].bullets`) must be verified. Since `bullets` is a flat `string[]` (not nested arrays), Firestore supports this natively.

**Alternatives considered**:
- Subcollection per experience — rejected (over-engineering; fact bank is always read/written atomically)
- localStorage — rejected (spec requires cross-device access via Firestore)

---

## Decision 5: Application Log Storage

**Decision**: Firestore subcollection `users/{uid}/resumeApplications/{appId}` with full resume snapshot stored as a JSON string field (to avoid nested Firestore array issues).

**Rationale**: Applications are queried as a list (paginated by date). Subcollection allows efficient ordering and deletion. The resume snapshot (nested objects + arrays) is serialized as a JSON string per CLAUDE.md's pattern for complex objects (same as GeoJSON serialization).

**Alternatives considered**:
- Single document with applications array — rejected (array grows unbounded; Firestore 1MB document limit would be hit quickly with resume snapshots)
- Separate top-level collection — rejected (per-user data should live under `users/{uid}` for Firestore rules clarity)

---

## Decision 6: URL Scraping — REST vs GraphQL

**Decision**: Implement as a **GraphQL query** (`scrapeJobUrl(url: String!): String`) in the Cloud Function.

**Rationale**: URL scraping is a read operation (fetch external URL, return text). GraphQL queries fit this perfectly. `cheerio` is already installed in `functions/`. The Cloud Function handler already has patterns for external HTTP calls (weather resolver, podcast resolver). SSRF protection (blocking private/internal IPs) required per Constitution Principle V.

**SSRF protection**: The resolver validates the URL hostname before fetching — blocks `localhost`, `127.x.x.x`, `10.x.x.x`, `172.16.x.x–172.31.x.x`, `192.168.x.x` ranges per Constitution Principle V.

**Alternatives considered**:
- REST endpoint — rejected (text response fits GraphQL; no binary data involved)
- Client-side fetch — rejected (CORS restrictions on career sites; server-side is required)

---

## Decision 7: OpenAI API Key Management

**Decision**: New Firebase secret `OPENAI_API_KEY` following the existing secrets pattern.

**Rationale**: The `openai` SDK (`^4.73.0`) is already installed in `functions/package.json`. A new secret is required since the existing `API_KEYS` secret is for weather/other APIs. Set up via: `printf "sk-..." | npx firebase functions:secrets:set OPENAI_API_KEY && gcloud secrets add-iam-policy-binding OPENAI_API_KEY --project=mycircle-dash --member="serviceAccount:441498720264-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"`.

**Alternatives considered**:
- Reusing existing secret bundle — rejected (different rotation lifecycle; mixing concerns)
- Using Gemini (already configured) — deferred; spec is AI-provider-agnostic; OpenAI is the reference implementation's choice and the SDK is already installed

---

## Decision 8: MFE Port Assignment

**Decision**: Port **3023** (next available gap in the current port sequence).

**Port survey**: 3000–3031 mostly used; confirmed gaps: 3003 (likely reserved), 3013, 3014, 3023. Port 3023 is the first clean available gap after 3022 (hiking-map).

---

## Decision 9: Session State for Generated Resume

**Decision**: Generated resume is stored in **React component state** (not persisted) until the user explicitly saves or downloads a PDF (which triggers the GraphQL `saveResumeApplication` mutation).

**Rationale**: Matches the reference implementation. Users iterate on a resume in-session; persisting every intermediate state would be wasteful. The inline editing state is local to the `GeneratedResumeView` component.

---

## Decision 10: Fact Bank Auto-Save Strategy

**Decision**: Auto-save using a **debounced GraphQL mutation** (1-second debounce via `useRef` + `setTimeout`).

**Rationale**: The reference implementation uses localStorage with 1-second debounce. In MyCircle, the same UX is achieved with a debounced `saveResumeFactBank` mutation. Apollo's optimistic response can give instant local UI feedback while the server write completes.

---

## Resolved NEEDS CLARIFICATION Items

None — all decisions resolved via research and existing project patterns.
