# Quickstart: AI Interviewer MFE Improvements

**Branch**: `026-ai-interviewer-improvements`

---

## Setup

This feature improves an existing MFE — no new package scaffolding needed.

```bash
git checkout 026-ai-interviewer-improvements
pnpm install
pnpm build:shared
```

---

## Running the Feature Locally

```bash
# Start shell + ai-interviewer MFE together
pnpm dev:interview

# Or start all MFEs
pnpm dev
```

Navigate to `http://localhost:3000/interview`.

---

## Key Files

| File | Purpose |
|------|---------|
| `functions/src/schema.ts` | Add new fields to `InterviewSessionSummary`, extend `SaveInterviewSessionInput`, add `exportQuestionBank` query and `importQuestions` mutation |
| `functions/src/resolvers/interviewSessions.ts` | Update `saveInterviewSession` to write new metadata fields; update `getInterviewSessions` to support filtering |
| `packages/shared/src/apollo/queries.ts` | Update `GET_INTERVIEW_SESSIONS` fragment; add `EXPORT_QUESTION_BANK` query and `IMPORT_QUESTIONS` mutation |
| `packages/ai-interviewer/src/hooks/useInterviewChat.ts` | Pass new metadata fields in `SAVE_INTERVIEW_SESSION` mutation variables |
| `packages/ai-interviewer/src/hooks/useQuestionBank.ts` | Add export/import mutation hooks |
| `packages/ai-interviewer/src/components/AiInterviewer.tsx` | Replace sessions dropdown with session history panel; add progress tab |
| `packages/ai-interviewer/src/components/InterviewSetup.tsx` | Add timer config controls |

---

## Development Order

1. **Backend first**: Extend `functions/src/schema.ts` + resolver, then `pnpm codegen`
2. **Shared queries**: Update `packages/shared/src/apollo/queries.ts` to use new fields
3. **Hook updates**: Update `useInterviewChat.ts` to pass new metadata; add export/import to `useQuestionBank.ts`
4. **New UI components**: SessionHistoryPanel, ProgressDashboard, TimerControl
5. **Tests**: Add test files for InterviewChat, QuestionPanel, QuestionManager
6. **Validation**: `pnpm validate_all` → all MCP validators must pass

---

## After Backend Changes

Whenever `functions/src/schema.ts` or `packages/shared/src/apollo/queries.ts` change:

```bash
pnpm codegen               # Regenerate types
pnpm build:shared          # Rebuild shared package
```

---

## Running Tests

```bash
# All tests in ai-interviewer package
pnpm --filter @mycircle/ai-interviewer test:run

# With coverage
pnpm --filter @mycircle/ai-interviewer test:coverage

# Full suite (run before every push)
pnpm lint && pnpm test:run && pnpm typecheck
```

---

## Firestore Index

The session history filtering requires a new compound index. Add to `firestore.indexes.json`:

```json
{
  "collectionGroup": "interviewSessions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "chapter", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

Deploy with: `firebase deploy --only firestore:indexes`

---

## Validation Checklist

Before opening PR:

- [ ] `pnpm build:shared` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test:run` passes (all new tests green)
- [ ] `pnpm typecheck` passes
- [ ] `cd functions && npx tsc --noEmit` passes (functions strict tsconfig)
- [ ] All 3 locale files have the new i18n keys
- [ ] `validate_all` MCP tool passes (run in Claude Code)
