# GraphQL Schema Extensions Contract

**Feature**: AI Interviewer MFE Improvements
**Extends**: `functions/src/schema.ts`
**Codegen required**: Yes — run `pnpm codegen` after applying changes

---

## Extended Type: `InterviewSessionSummary`

Add the following fields to the existing `InterviewSessionSummary` type:

```graphql
type InterviewSessionSummary {
  # --- existing fields ---
  id: ID!
  questionPreview: String!
  messageCount: Int!
  mode: String
  updatedAt: String
  createdAt: String
  # --- new fields ---
  chapter: String
  difficulty: String
  questionCount: Int
  overallScore: Float
  avgTechnical: Float
  avgProblemSolving: Float
  avgCommunication: Float
  avgDepth: Float
}
```

**Notes**:
- All new fields are nullable — custom-mode sessions and incomplete sessions may not have values.
- Values are computed from `interviewState.scores[]` and `config` at save time and written to the Firestore metadata document. No additional Cloud Storage reads during listing.

---

## Extended Input: `SaveInterviewSessionInput`

Add the following fields to enable writing the new metadata fields:

```graphql
input SaveInterviewSessionInput {
  # --- existing fields ---
  id: ID
  question: String!
  document: String!
  messages: [SessionMessageInput!]!
  sessionName: String
  interviewState: JSON
  scores: JSON
  config: JSON
  # --- new fields ---
  chapter: String
  difficulty: String
  questionCount: Int
  overallScore: Float
  avgTechnical: Float
  avgProblemSolving: Float
  avgCommunication: Float
  avgDepth: Float
}
```

---

## Extended Query: `getInterviewSessions`

Add optional filtering parameters:

```graphql
type Query {
  getInterviewSessions(
    chapter: String        # Filter by chapter name (exact match); null = all chapters
    dateFilter: String     # One of: "7d" | "30d" | "all" (default: "all")
  ): [InterviewSessionSummary!]!
}
```

**Resolver behaviour**:
- If `chapter` is provided, apply a Firestore equality filter on the `chapter` field.
- If `dateFilter` is `"7d"`, filter `createdAt >= now - 7 days`.
- If `dateFilter` is `"30d"`, filter `createdAt >= now - 30 days`.
- Results are always ordered by `createdAt DESC`.
- **Firestore compound index required**: `(chapter ASC, createdAt DESC)`.

---

## New Query: `exportQuestionBank`

```graphql
type Query {
  exportQuestionBank(
    chapter: String   # Optional: filter to a single chapter; null = all chapters
  ): String!          # Returns JSON string of QuestionExportBundle
}
```

**QuestionExportBundle JSON shape** (not a GraphQL type — returned as serialized string):
```json
{
  "exportedAt": "2026-04-07T12:00:00Z",
  "chapter": "Binary Search",
  "questions": [
    {
      "chapter": "Binary Search",
      "chapterSlug": "binary-search",
      "difficulty": "medium",
      "title": "Find First and Last Position",
      "description": "...",
      "tags": ["array", "binary-search"]
    }
  ]
}
```

**Notes**:
- Returns all questions matching the filter from Cloud Storage.
- The client downloads this as `question-bank-export.json`.

---

## New Mutation: `importQuestions`

```graphql
type ImportResult {
  added: Int!
  skipped: Int!
  errors: [String!]!
}

type Mutation {
  importQuestions(
    questions: [CreateInterviewQuestionInput!]!
  ): ImportResult!
}
```

**Resolver behaviour**:
1. Validate each input question has required fields (`chapter`, `chapterSlug`, `difficulty`, `title`, `description`).
2. Load the existing question bank from Cloud Storage.
3. For each input question, check if a question with the same `(title, chapter)` pair already exists.
4. Add new questions; skip duplicates; collect validation errors for malformed entries.
5. Write the updated question bank back to Cloud Storage atomically.
6. Return counts.

**Error handling**:
- Malformed entries (missing required fields) are recorded in `errors[]` with the entry title and reason.
- The mutation does NOT fail if some entries are skipped or malformed — it processes what it can and reports.
- If Cloud Storage write fails, the mutation throws a GraphQL error and no partial write occurs.

---

## New i18n Keys Required

Add to all 3 locale files (`en`, `es`, `zh`):

```
aiInterviewer.sessionHistory          "Session History"
aiInterviewer.noSessions              "No sessions yet. Start your first interview!"
aiInterviewer.filterByChapter        "Filter by chapter"
aiInterviewer.filterByDate           "Filter by date"
aiInterviewer.allChapters            "All chapters"
aiInterviewer.last7Days              "Last 7 days"
aiInterviewer.last30Days             "Last 30 days"
aiInterviewer.allTime                "All time"
aiInterviewer.overallScore           "Overall score"
aiInterviewer.reRunSetup             "Re-run this setup"
aiInterviewer.viewSession            "View session"
aiInterviewer.progressDashboard      "My Progress"
aiInterviewer.noProgressData         "Complete more structured interviews to see your progress"
aiInterviewer.technical              "Technical"
aiInterviewer.problemSolving         "Problem Solving"
aiInterviewer.communication         "Communication"
aiInterviewer.depth                  "Depth"
aiInterviewer.exportQuestions        "Export questions"
aiInterviewer.importQuestions        "Import questions"
aiInterviewer.exportSuccess          "Export downloaded"
aiInterviewer.importSuccess          "{added} questions added, {skipped} skipped"
aiInterviewer.importError            "Import failed: {error}"
aiInterviewer.importFileInvalid      "Invalid file format. Please use a previously exported question bank file."
aiInterviewer.timerLabel             "Time limit"
aiInterviewer.timerEnabled           "Enable timer"
aiInterviewer.timerMinutes           "{n} minutes"
aiInterviewer.timerCustom            "Custom"
aiInterviewer.timerWarning           "5 minutes remaining"
aiInterviewer.timerExpired           "Time's up! Evaluating your answers..."
aiInterviewer.timerRemaining         "{m}:{s} remaining"
```
