# Data Model: Resume Tailor AI (015)

**Phase**: 1 — Design
**Date**: 2026-03-25

---

## Entities

### 1. ResumeFactBank

**What it represents**: The user's complete professional history — the source of truth for all resume generation. Stored as a single Firestore document.

**Firestore path**: `users/{uid}/resumeFactBank/default`

**Fields**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `contact.name` | string | yes | Full name |
| `contact.email` | string | no | |
| `contact.phone` | string | no | |
| `contact.location` | string | no | City, State |
| `contact.linkedin` | string | no | Full URL |
| `contact.github` | string | no | Full URL |
| `contact.website` | string | no | Full URL |
| `experiences` | ResumeExperience[] | yes | Array of work experiences |
| `education` | ResumeEducation[] | yes | |
| `skills` | string[] | yes | "Category: skill1, skill2" format |
| `projects` | ResumeProject[] | no | Optional projects section |
| `updatedAt` | Timestamp | yes | Firestore server timestamp on every save |

**Validation rules**:
- `contact.name` must be non-empty before generation can run
- At least one experience required for generation
- Skills strings use "Category: comma-separated-items" format; plain strings also accepted

---

### 2. ResumeExperience

**What it represents**: A work experience at a single company. Contains one or more title versions (different role presentations), each with its own bullet points.

**Structure** (nested within ResumeFactBank):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | UUID, generated client-side |
| `company` | string | yes | Company name |
| `location` | string | no | City, State or Remote |
| `startDate` | string | yes | "Jan 2022", "2020", etc. |
| `endDate` | string | yes | "Present" or date string |
| `versions` | ResumeVersion[] | yes | At least one version required |

---

### 3. ResumeVersion

**What it represents**: A specific title presentation for a work experience. A user may have "Product Manager" and "Senior Product Manager" versions for the same job, letting the AI pick the most appropriate one per job description.

**Structure** (nested within ResumeExperience):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | UUID, generated client-side |
| `title` | string | yes | Job title |
| `bullets` | string[] | yes | Achievement bullet points; no trailing periods |

---

### 4. ResumeEducation

**What it represents**: An education entry (degree, school, dates).

**Structure** (nested within ResumeFactBank):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | UUID, generated client-side |
| `school` | string | yes | Institution name |
| `location` | string | no | City, State |
| `degree` | string | yes | e.g., "Bachelor of Science" |
| `field` | string | yes | e.g., "Computer Science" |
| `startDate` | string | no | |
| `endDate` | string | no | "Present" or year |
| `notes` | string[] | no | GPA, honors, relevant coursework |

---

### 5. ResumeProject

**What it represents**: A personal or professional project, shown in a separate resume section.

**Structure** (nested within ResumeFactBank):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | UUID |
| `name` | string | yes | Project name |
| `startDate` | string | no | |
| `endDate` | string | no | |
| `bullets` | string[] | yes | Description bullet points |

---

### 6. GeneratedResume (Transient — React State)

**What it represents**: The AI-tailored resume output. Held in component state for the current session; not persisted until user saves or downloads.

**Fields**:

| Field | Type | Notes |
|-------|------|-------|
| `contact` | ResumeContact | From fact bank |
| `experiences` | ResumeExperience[] | Selected version + rewritten bullets |
| `education` | ResumeEducation[] | From fact bank |
| `skills` | string[] | AI-reorganized, 2–3 categories |
| `projects` | ResumeProject[] | From fact bank, unchanged |
| `atsScore` | ResumeAtsScore | Before/after coverage metrics |
| `keywordReport` | ResumeKeywordReport | Full keyword analysis |

---

### 7. ResumeAtsScore (Embedded in GeneratedResume)

**What it represents**: The ATS keyword coverage metrics before and after optimization.

| Field | Type | Notes |
|-------|------|-------|
| `beforeScore` | float | 0–100, weighted score before optimization |
| `score` | float | 0–100, weighted score after optimization |
| `covered` | string[] | Keywords found in optimized resume |
| `missing` | string[] | Keywords still missing after optimization |
| `beforeCovered` | string[] | Keywords found in original resume |
| `beforeMissing` | string[] | Keywords missing in original resume |
| `hardSkillsMissing` | string[] | Hard skills still not covered (highest priority) |

**Scoring formula**: `score = (sum of weights for covered keywords) / (sum of all keyword weights) × 100`
- Hard skills: 2.0 weight
- Title/function: 1.5 weight
- Business context: 1.0 weight

---

### 8. ResumeKeywordReport (Embedded in GeneratedResume)

**What it represents**: Structured analysis of the job description's keywords.

| Field | Type | Notes |
|-------|------|-------|
| `role` | string | Job title extracted from JD |
| `company` | string | Company name extracted from JD |
| `hardSkills` | string[] | Tools, languages, platforms (2x weight) |
| `titleKeywords` | string[] | Job title variants (1.5x weight) |
| `actionKeywords` | string[] | "Verb + object" phrases |
| `businessContext` | string[] | Domain business concepts (1x weight) |
| `domainKeywords` | string[] | Industry terms |
| `hardFilters` | string[] | Explicit requirements (years of experience, degree) |
| `top10` | string[] | 10 most important keywords, ranked |
| `alreadyHave` | string[] | Keywords present before optimization |
| `needToAdd` | string[] | Keywords missing before optimization |

---

### 9. ResumeApplication

**What it represents**: A point-in-time snapshot of a submitted job application. Persisted to Firestore.

**Firestore path**: `users/{uid}/resumeApplications/{appId}`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Auto-generated Firestore doc ID |
| `date` | Timestamp | yes | Server timestamp when saved |
| `company` | string | yes | |
| `role` | string | yes | Job title |
| `atsScoreBefore` | float | yes | 0–100 |
| `atsScoreAfter` | float | yes | 0–100 |
| `resumeSnapshot` | string | yes | JSON.stringify(GeneratedResume) — avoids Firestore nested array issues |
| `jdText` | string | no | Job description text used for generation |

**Note**: `resumeSnapshot` is serialized as a JSON string per CLAUDE.md's Firestore gotcha pattern (same as GeoJSON geometry serialization) because `GeneratedResume` contains nested arrays (`experiences[].versions[].bullets[]`).

---

## State Transitions

### Fact Bank
```
Empty → Populated (via file upload parse OR manual entry)
Populated → Updated (via inline edit, auto-save triggers debounced mutation)
Populated → Exported (JSON file download, no state change)
```

### Resume Generation Session
```
No JD → JD Entered (URL scraped or text pasted)
JD Entered → Generating (AI pipeline running, 4–30s)
Generating → Generated (resume displayed with ATS score)
Generated → Boosted (optional boost pass, new ATS score)
Generated/Boosted → Edited (inline edits, ATS score marked stale)
Edited → Recalculated (ATS score updated client-side, no AI call)
Generated/Boosted/Edited → Saved (application written to Firestore)
Generated/Boosted/Edited → Downloaded (PDF printed, application auto-saved)
```

---

## Firestore Security Rules (additions needed)

```
match /users/{uid}/resumeFactBank/{docId} {
  allow read, write: if request.auth.uid == uid;
}
match /users/{uid}/resumeApplications/{appId} {
  allow read, write: if request.auth.uid == uid;
  allow delete: if request.auth.uid == uid;
}
```
