# Quickstart: Resume Tailor AI (015)

**Phase**: 1 — Design
**Date**: 2026-03-25
**For**: Implementer reference

---

## What Gets Built

A new MyCircle MFE at `/resume-tailor` with three tabs:
1. **Fact Bank** — Upload and manage professional experience library
2. **Generate** — Input a job description, generate tailored resume, view ATS score
3. **Applications** — Track and review past submitted resumes

---

## Implementation Order

### Step 1 — Backend: GraphQL Schema + Resolvers

**1a. Add types and queries/mutations to `functions/src/schema.ts`**
- See `contracts/graphql-schema.md` for the complete GraphQL additions

**1b. Create `functions/src/resolvers/resumeTailor.ts`**

Key resolver logic:
- `resumeFactBank` — reads `users/{uid}/resumeFactBank/default` from Firestore
- `saveResumeFactBank` — writes full document to `users/{uid}/resumeFactBank/default`
- `scrapeJobUrl(url)` — fetches URL server-side (with SSRF protection), extracts text via `cheerio`
- `generateResume(jdText)` — calls OpenAI API with 4 prompts:
  1. Extract keyword report from JD (JSON mode, temperature 0.1)
  2. Select best experience version per company (JSON mode, temperature 0.1)
  3. Rewrite bullets to include missing keywords (JSON mode, temperature 0.2)
  4. Reorganize skills into 2–3 categories (JSON mode, temperature 0.2)
  Prompts 1+2 run in parallel; 3+4 run after 1+2 complete
- `boostAtsScore(resumeJson, jdText)` — aggressive rewrite pass (temperature 0.3), inserts business context keywords and hard skills naturally
- `resumeApplications(limit)` — list from `users/{uid}/resumeApplications` ordered by `date` desc
- `saveResumeApplication(input)` — writes to `users/{uid}/resumeApplications/{newId}`, serializes resume as JSON string
- `deleteResumeApplication(id)` — deletes from subcollection

**1c. Register in `functions/src/resolvers/index.ts`**
- Import and spread `createResumeTailorQueryResolvers` and `createResumeTailorMutationResolvers`
- Pass `getOpenAiKey` closure

**1d. Add secret to `graphql` handler in `functions/src/handlers/graphql.ts`**
- Add `'OPENAI_API_KEY'` to the `secrets` array
- Add `const openAiKey = process.env.OPENAI_API_KEY || '';` in `getServer()`
- Pass `() => openAiKey` to `createResolvers()`

**1e. Add new resolver deps to `functions/package.json`**
```json
"mammoth": "^1.8.0",
"pdfjs-dist": "^4.0.0"
```

**1f. Run codegen**
```bash
pnpm codegen
```

---

### Step 2 — Backend: REST Upload Endpoint

**2a. Create `functions/src/handlers/resumeTailor.ts`**

```typescript
export const resumeTailor = onRequest({
  cors: ALLOWED_ORIGINS,
  invoker: 'public',
  maxInstances: 5,
  memory: '512MiB',
  timeoutSeconds: 120,
  secrets: ['OPENAI_API_KEY'],
}, async (req, res) => {
  // POST /resume-tailor/upload → parse resume file, return structured fact bank
  // see contracts/rest-api.md for full request/response spec
});
```

**2b. Export from `functions/src/index.ts`**
```typescript
export { resumeTailor } from './handlers/resumeTailor.js';
```

**2c. Add rewrite to `firebase.json`**
Before the catch-all rule:
```json
{ "source": "/resume-tailor/**", "function": "resumeTailor" }
```

**2d. Add Firestore rules** (in `firestore.rules`)
```
match /users/{uid}/resumeFactBank/{docId} {
  allow read, write: if request.auth.uid == uid;
}
match /users/{uid}/resumeApplications/{appId} {
  allow read, write: if request.auth.uid == uid;
  allow delete: if request.auth.uid == uid;
}
```

---

### Step 3 — Shell: Window Bridge

**3a. Add window bridge to `packages/shell/src/lib/firebase.ts`**
```typescript
// Resume Tailor upload bridge
window.__resumeTailor = {
  uploadAndParse: async (fileName, fileBase64, contentType) => { ... }
};
```

**3b. Add type declaration to `packages/shell/src/types/window.d.ts`** (or equivalent globals file)
```typescript
interface Window {
  __resumeTailor?: {
    uploadAndParse: (fileName: string, fileBase64: string, contentType: string) => Promise<Partial<ResumeFactBank>>;
  };
}
```

---

### Step 4 — New MFE Package

**Port**: 3023
**Federation name**: `resumeTailor`
**Package name**: `@mycircle/resume-tailor`
**Directory**: `packages/resume-tailor/`

**4a. Create package.json** (follow digital-library pattern, port 3023)

**4b. Create vite.config.ts**
```typescript
federation({
  name: 'resumeTailor',
  filename: 'remoteEntry.js',
  exposes: { './ResumeTailor': './src/components/ResumeTailor.tsx' },
  shared: { react, 'react-dom', 'react-router', '@mycircle/shared' }
})
```

**4c. Create component structure**
```
packages/resume-tailor/src/
├── main.tsx
├── components/
│   ├── ResumeTailor.tsx           # Tab controller (Fact Bank / Generate / Applications)
│   ├── FactBankEditor.tsx         # Upload + edit experiences/education/skills
│   ├── ExperienceCard.tsx         # Single experience with version switcher
│   ├── ResumeGenerator.tsx        # JD input (URL/text) + Generate button
│   ├── GeneratedResumeView.tsx    # Inline-editable resume output + print target
│   ├── AtsScoreCard.tsx           # Before/after score + improvement badge
│   ├── KeywordReportPanel.tsx     # Collapsible keyword breakdown by category
│   └── ApplicationsLog.tsx        # List + expand/delete applications
└── hooks/
    ├── useFactBank.ts             # GraphQL queries + debounced save mutation
    ├── useResumeGeneration.ts     # generateResume + boostAtsScore mutations
    └── useApplicationsLog.ts      # CRUD for application records
```

**Key implementation notes**:
- `GeneratedResumeView.tsx` must have a `data-print-target` attribute; the download button calls `window.print()` with print CSS scoped to this element
- Print CSS: `@media print { body * { visibility: hidden; } [data-print-target], [data-print-target] * { visibility: visible; } [data-print-target] { position: absolute; left: 0; top: 0; } }`
- Inline editing: use `contentEditable` or controlled inputs; `onBlur` triggers local state update
- ATS recalculation: pure TypeScript function (no API call) — stemming + keyword matching runs client-side
- `useFactBank` hook exposes `debouncedSave(factBank)` — uses `useRef` to hold a `setTimeout` ID, clears + resets on each call

---

### Step 5 — Shell Integration (23 touchpoints)

**5a. `packages/shell/vite.config.ts`**
```typescript
const resumeTailorRemote = isProduction
  ? '/resume-tailor/assets/remoteEntry.js'
  : 'http://localhost:3023/assets/remoteEntry.js';
// Add resumeTailor: resumeTailorRemote to federation remotes
```

**5b. `packages/shell/src/App.tsx`**
```typescript
const ResumeTailorMF = tracedLazy('mfe_resume_tailor_load', () => import('resumeTailor/ResumeTailor'), getPerf);
// Add route:
<Route path="resume-tailor" element={<MFEPageWrapper component={ResumeTailorMF} name="Resume Tailor" />} />
```

**5c. `packages/shell/src/lib/navConfig.ts`**
- Add `/resume-tailor` to `ROUTE_MODULE_MAP`
- Add to `NAV_GROUPS` (suggest group: Workspace or Career)
- Add to `ALL_NAV_ITEMS`

**5d. `packages/shell/src/routeConfig.ts`**
```typescript
'resume-tailor': 'nav.resumeTailor',
```

**5e. `packages/shell/src/components/widgets/widgetConfig.ts`**
- Add `'resumeTailor'` to `WidgetType` union
- Create `ResumeTailorWidget.tsx` (shows ATS score of most recent application)
- Register in `WIDGET_COMPONENTS`, `WIDGET_ROUTES`, `ALL_WIDGET_IDS`

**5f. `packages/shell/src/components/layout/CommandPalette.tsx`**
```typescript
'/resume-tailor': 'commandPalette.goToResumeTailor',
```

**5g. `packages/shell/tailwind.config.js`**
- Add `'../../packages/resume-tailor/src/**/*.{ts,tsx}'` to content array

**5h. `packages/shell/remotes.d.ts`** (if exists)
```typescript
declare module 'resumeTailor/ResumeTailor' {
  const ResumeTailor: React.FC;
  export default ResumeTailor;
}
```

**5i. `packages/shell/test/mocks/`** — add mock file for the remote

**5j. Root `vitest.config.ts` + `packages/shell/vitest.config.ts`** — add alias for mock

---

### Step 6 — i18n Keys

Add to all 3 locale files (`packages/shared/src/i18n/locales/en.ts`, `es.ts`, `zh.ts`):

```typescript
// Resume Tailor
resumeTailor: {
  title: 'Resume Tailor',
  tabs: {
    factBank: 'Fact Bank',
    generate: 'Generate',
    applications: 'Applications',
  },
  factBank: {
    upload: 'Upload Resume',
    uploadHint: 'PDF, DOCX, or text files supported',
    addExperience: 'Add Experience',
    addEducation: 'Add Education',
    addSkill: 'Add Skill',
    addProject: 'Add Project',
    export: 'Export JSON',
    import: 'Import JSON',
    saving: 'Saving...',
    saved: 'Saved',
    emptyState: 'Upload a resume or add your experience manually to get started.',
  },
  generate: {
    jdLabel: 'Job Description',
    urlPlaceholder: 'Paste job posting URL…',
    textPlaceholder: 'Or paste job description text here…',
    scraping: 'Fetching job description…',
    scrapeFailed: 'Could not fetch the job page automatically. Please paste the description below.',
    generateButton: 'Generate Resume',
    generating: 'Generating…',
    boostButton: 'Boost ATS Score',
    boosting: 'Boosting…',
    recalculate: 'Recalculate Score',
    downloadPdf: 'Download PDF',
    saveApplication: 'Save Application',
    atsScore: 'ATS Score',
    beforeScore: 'Before',
    afterScore: 'After',
    improvement: '+{{points}} points',
    keywordReport: 'Keyword Report',
    hardSkills: 'Hard Skills',
    titleKeywords: 'Title Keywords',
    actionKeywords: 'Action Keywords',
    businessContext: 'Business Context',
    domainKeywords: 'Domain Keywords',
    hardFilters: 'Requirements',
    top10: 'Top 10 Keywords',
    covered: 'Covered',
    missing: 'Missing',
  },
  applications: {
    emptyState: 'No saved applications yet. Generate and download a resume to save your first application.',
    export: 'Export Applications',
    import: 'Import Applications',
    delete: 'Delete',
    confirmDelete: 'Delete this application record?',
    atsImprovement: '+{{points}} pts',
    applied: 'Applied',
    expandResume: 'View Resume',
    collapseResume: 'Hide Resume',
  },
  errors: {
    noFactBank: 'Add your experience to the Fact Bank before generating a resume.',
    uploadFailed: 'Could not parse this file. Please try a different format.',
    generateFailed: 'Resume generation failed. Please try again.',
    saveFailed: 'Could not save. Please try again.',
  },
},
nav: {
  resumeTailor: 'Resume Tailor',
},
commandPalette: {
  goToResumeTailor: 'Go to Resume Tailor',
},
```

---

### Step 7 — Deployment Updates

**7a. `deploy/docker/Dockerfile`**
- Add in build stage: `COPY packages/resume-tailor/package.json packages/resume-tailor/`
- Add in runtime stage: copy built assets

**7b. `scripts/assemble-firebase.mjs`**
- Add `'resume-tailor'` to the `mfeDirs` array

**7c. `server/production.ts`**
- Add `'/resume-tailor'` to the `MFE_PREFIXES` array

**7d. Root `package.json`**
```json
"dev:resume-tailor": "pnpm --filter @mycircle/resume-tailor dev",
"preview:resume-tailor": "pnpm --filter @mycircle/resume-tailor preview",
```
- Add `pnpm preview:resume-tailor` to the `"dev"` and `"dev:mf"` concurrently commands

---

### Step 8 — Firebase Secret

```bash
printf "sk-proj-..." | npx firebase functions:secrets:set OPENAI_API_KEY
gcloud secrets add-iam-policy-binding OPENAI_API_KEY \
  --project=mycircle-dash \
  --member="serviceAccount:441498720264-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### Step 9 — AI Tool Registry

Add to `scripts/mcp-tools/mfe-tools.ts` `navigateTo` page list:
```typescript
'/resume-tailor'  // Resume Tailor — AI resume builder and job application tracker
```

---

### Step 10 — Docs spec

Create `docs/specs/015-resume-tailor/spec.md` (symlink or copy from `specs/015-resume-tailor/spec.md`) to satisfy the `spec-check` CI gate.

---

## Local Dev Command

```bash
pnpm build:shared && pnpm dev:resume-tailor &  # start MFE standalone
pnpm dev:shell                                  # start shell (connects to MFE on 3023)
```

Or full suite:
```bash
pnpm dev  # starts all remotes + shell concurrently
```

---

## Validation Checklist

After implementation, run:
```bash
pnpm validate_all        # MCP validators
pnpm build:shared        # Confirm codegen + shared build
pnpm lint && pnpm test:run && pnpm typecheck
cd functions && npx tsc --noEmit  # functions/ strict typecheck
```
