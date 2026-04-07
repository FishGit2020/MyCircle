# Data Model: AI Interviewer MFE Improvements

**Phase 1 Output** | Branch: `026-ai-interviewer-improvements`

---

## Existing Entities (unchanged)

### InterviewQuestion
Represents a single question in the shared question bank.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `ID!` | Firestore-generated |
| `chapter` | `String!` | e.g., "Binary Search" |
| `chapterSlug` | `String!` | e.g., "binary-search" |
| `difficulty` | `String!` | `easy` \| `medium` \| `hard` |
| `title` | `String!` | Short question title |
| `description` | `String!` | Full problem description |
| `tags` | `[String!]!` | Freeform topic tags |

### EvaluationScore
Per-question AI evaluation result. Stored inside `InterviewSessionDetail.scores[]`.

| Field | Type | Notes |
|-------|------|-------|
| `questionId` | `String!` | Links to `InterviewQuestion.id` |
| `technical` | `Float!` | 1–10 scale |
| `problemSolving` | `Float!` | 1–10 scale |
| `communication` | `Float!` | 1–10 scale |
| `depth` | `Float!` | 1–10 scale |
| `feedback` | `String!` | 1–2 sentence AI-written summary |

### SessionMessage
One chat message in a session.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String!` | Client-generated UUID |
| `role` | `String!` | `user` \| `assistant` |
| `content` | `String!` | Full message text |
| `timestamp` | `Float!` | Unix milliseconds |

---

## Extended Entities (new fields added by this feature)

### InterviewSessionSummary *(extended)*
Used by the session list query. New fields enable the history view and analytics panel without loading full session data.

| Field | Type | New? | Notes |
|-------|------|------|-------|
| `id` | `ID!` | — | Existing |
| `questionPreview` | `String!` | — | Existing — short preview of the question |
| `messageCount` | `Int!` | — | Existing |
| `mode` | `String` | — | Existing — `custom` \| `question-bank` |
| `updatedAt` | `String` | — | Existing |
| `createdAt` | `String` | — | Existing |
| `chapter` | `String` | ✅ New | Chapter name; null for custom-mode sessions |
| `difficulty` | `String` | ✅ New | `easy` \| `medium` \| `hard`; null for custom |
| `questionCount` | `Int` | ✅ New | Total questions in the session; null for custom |
| `overallScore` | `Float` | ✅ New | Mean of all per-question averages; null if no scores |
| `avgTechnical` | `Float` | ✅ New | Mean of `technical` across all questions |
| `avgProblemSolving` | `Float` | ✅ New | Mean of `problemSolving` across all questions |
| `avgCommunication` | `Float` | ✅ New | Mean of `communication` across all questions |
| `avgDepth` | `Float` | ✅ New | Mean of `depth` across all questions |

**Storage**: All new fields are written to the Firestore document at save time, computed from `interviewState.scores[]` and `config`. No additional Cloud Storage reads needed for listing.

**Validation rules**:
- All new fields are nullable — custom-mode sessions and incomplete sessions may not have all values.
- `overallScore` = mean of `(technical + problemSolving + communication + depth) / 4` per question, then mean across questions.
- Dimension averages are stored to 2 decimal places.

---

## New Entities

### QuestionExportBundle
Represents a portable snapshot of one or more question bank entries for import/export.

| Field | Type | Notes |
|-------|------|-------|
| `exportedAt` | `String!` | ISO timestamp of when the export was generated |
| `chapter` | `String \| null` | Filter used; null means all chapters exported |
| `questions` | `[ExportedQuestion!]!` | The exported question entries |

### ExportedQuestion
A question as it appears in an export file. Maps 1:1 to `InterviewQuestion` minus the generated ID.

| Field | Type | Notes |
|-------|------|-------|
| `chapter` | `String!` | Chapter name |
| `chapterSlug` | `String!` | URL-safe chapter identifier |
| `difficulty` | `String!` | `easy` \| `medium` \| `hard` |
| `title` | `String!` | Short question title |
| `description` | `String!` | Full problem description |
| `tags` | `[String!]!` | Freeform tags |

**Deduplication rule on import**: A question is considered a duplicate if another question with the same `(title, chapter)` pair already exists in the question bank. Duplicates are skipped; no error is thrown.

### ImportResult
Returned by the `importQuestions` mutation.

| Field | Type | Notes |
|-------|------|-------|
| `added` | `Int!` | Count of newly created questions |
| `skipped` | `Int!` | Count of duplicates skipped |
| `errors` | `[String!]!` | Validation error messages (if any entries were malformed) |

### TimerConfig *(frontend-only, stored in session config JSON)*
Session-scoped timer settings. Stored within the existing `config` JSON field of `InterviewSessionDetail`.

| Field | Type | Notes |
|-------|------|-------|
| `enabled` | `Boolean!` | Whether timer is active for this session |
| `totalMinutes` | `Int!` | Chosen duration (20, 30, 45, or custom 1–120) |
| `startTimestamp` | `Float \| null` | Unix milliseconds when timer started; null until interview begins |

**State transitions**:
- `enabled: false` → Timer not shown; any set duration is ignored
- `enabled: true, startTimestamp: null` → Timer enabled but not yet started (setup phase)
- `enabled: true, startTimestamp: <value>` → Timer running; elapsed = `Date.now() - startTimestamp`
- Timer fires evaluation automatically when `elapsed >= totalMinutes * 60 * 1000`

---

## Firestore Document Schema (updated)

**Collection path**: `users/{uid}/interviewSessions/{sessionId}`

**Before (existing fields)**:
```
questionPreview: string
messageCount: number
storageRef: string
mode: string
updatedAt: Timestamp
createdAt: Timestamp
```

**After (with new fields)**:
```
questionPreview: string
messageCount: number
storageRef: string
mode: string
updatedAt: Timestamp
createdAt: Timestamp
chapter: string | null          ← NEW
difficulty: string | null       ← NEW
questionCount: number | null    ← NEW
overallScore: number | null     ← NEW
avgTechnical: number | null     ← NEW
avgProblemSolving: number | null ← NEW
avgCommunication: number | null ← NEW
avgDepth: number | null         ← NEW
```

**Index requirements**: Compound index on `(chapter ASC, createdAt DESC)` for chapter-filtered history queries.

---

## Entity Relationships

```
User (uid)
  └── InterviewSession (1:N)
        ├── interviewState.scores[] → EvaluationScore (1:N per session)
        │     └── questionId → InterviewQuestion (N:1)
        └── config.timer → TimerConfig (1:1 per session)

QuestionBank
  └── InterviewQuestion (1:N)
        └── ExportedQuestion (1:1 projection for export)
```
