# Feature Specification: Resume Tailor AI

**Feature Branch**: `015-resume-tailor`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "study /Users/youpenghuang/Documents/GitHub/resume-tailor-ai, i want to build a new MFE and feature to have all features from this repo that supports"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build & Manage Experience Fact Bank (Priority: P1)

A job seeker wants a central library where they can store and maintain all their professional experiences, education, skills, and projects — their "professional fact bank." They upload one or more existing resumes and let the system extract and organize all the data, then review and edit as needed.

**Why this priority**: Without a fact bank, the resume generation pipeline has no source material. This is the foundational data entry step that unlocks all other features. It also delivers immediate standalone value as a structured resume editor.

**Independent Test**: User can upload a PDF resume, verify contact info and experiences are extracted correctly, edit a bullet point, add a skill, and confirm data persists across page reloads — delivering a working resume editor without any AI generation.

**Acceptance Scenarios**:

1. **Given** a user on the Fact Bank tab, **When** they upload a PDF or DOCX resume file, **Then** the system extracts and displays their contact info, work experiences (with titles and bullet points), education, and skills in an editable format.
2. **Given** extracted fact bank data, **When** the user edits any field (contact, experience bullet, education, skill), **Then** the change is reflected immediately and automatically saved within 1 second.
3. **Given** multiple uploaded resume files, **When** the system processes them, **Then** experiences from the same company are merged without duplicates, and the user can manage multiple role title versions per company.
4. **Given** an existing fact bank, **When** the user clicks "Export JSON", **Then** a downloadable JSON file is generated containing all fact bank data; importing that file restores the exact same state.

---

### User Story 2 - Generate AI-Tailored Resume from Job Description (Priority: P1)

A job seeker copies a job posting URL or text and asks the system to generate a resume tailored specifically to that role. The AI selects the best experience version, rewrites bullets to naturally include missing keywords, and reorganizes skills — then shows a before/after ATS score comparison.

**Why this priority**: This is the core value proposition — eliminating the manual work of customizing resumes for each application. Together with the fact bank, this delivers the complete end-to-end feature.

**Independent Test**: User pastes a job description, clicks "Generate Resume," and within 30 seconds receives a tailored resume with an ATS match score, along with a keyword report showing which terms are covered and which are missing.

**Acceptance Scenarios**:

1. **Given** a populated fact bank, **When** the user pastes a job description URL, **Then** the system automatically retrieves and displays the job description text (for supported platforms: Greenhouse, Lever, Ashby HQ, and generic career pages).
2. **Given** a job description (URL or pasted text), **When** the user clicks "Generate Resume", **Then** the system runs AI analysis and within 30 seconds presents a tailored resume showing: (a) selected experience title versions, (b) keyword-optimized bullet points, (c) reorganized skills, and (d) before/after ATS match scores.
3. **Given** a generated resume, **When** the user views the keyword report, **Then** they see categorized keywords (hard skills, title/function, action phrases, business context, domain terms), which ones are covered vs. missing, and the top 10 most important keywords.
4. **Given** a generated resume, **When** the user clicks "Boost ATS Score", **Then** the system runs an aggressive optimization pass to insert remaining missing keywords naturally, recalculates the ATS score, and highlights the improvement.

---

### User Story 3 - Download ATS-Friendly PDF Resume (Priority: P2)

After reviewing and editing a generated resume, the user wants to download a clean, ATS-compatible single-page PDF ready for submission.

**Why this priority**: Without a downloadable output, users cannot actually use the tool for real applications. The PDF is the deliverable.

**Independent Test**: User clicks "Download PDF" on a generated resume and receives a single-page, cleanly formatted PDF file that contains all resume sections — verifiable by opening the downloaded file.

**Acceptance Scenarios**:

1. **Given** a generated (and optionally edited) resume, **When** the user clicks "Download PDF", **Then** a PDF is generated and downloaded using an ATS-safe format (no tables, no multi-column layouts, standard fonts).
2. **Given** a resume that would exceed one page, **When** the PDF is generated, **Then** the system automatically trims the lowest-impact bullets to fit the content to a single page without user intervention.
3. **Given** a PDF download, **When** it completes, **Then** the application is automatically saved to the Applications Log with the date, company, role, ATS score snapshot, and full resume content.

---

### User Story 4 - Inline Resume Editing and Score Recalculation (Priority: P2)

After AI generation, the user wants to manually tweak specific bullet points, add/remove skills, or adjust experience details. They can click any field to edit it and recalculate the ATS score on demand without triggering a new AI call.

**Why this priority**: AI output is never perfect. Users need to review and refine before submitting. Inline editing preserves the work done by AI while giving users full control.

**Independent Test**: User clicks a bullet point on the generated resume, modifies the text, clicks "Recalculate Score," and the ATS score updates to reflect the change — no AI API call required.

**Acceptance Scenarios**:

1. **Given** a generated resume, **When** the user clicks on any text field (bullet point, skill, contact info), **Then** the field becomes editable in place without navigating away.
2. **Given** inline edits have been made, **When** the user clicks "Recalculate Score", **Then** the ATS match score updates instantly based on current resume content without making any AI API call.
3. **Given** inline edits, **When** the user hovers over any experience row, **Then** a delete button appears allowing removal of that bullet or row.

---

### User Story 5 - Track and Review Past Applications (Priority: P3)

The user wants to maintain a history of all job applications they have submitted through the tool — including the tailored resume and ATS score for each — so they can reference past applications and track their job search progress.

**Why this priority**: Application tracking adds value but is not required to use the core resume generation features. It enhances the tool from a one-time generator into a job search companion.

**Independent Test**: User views the Applications tab, sees a list of saved applications each showing company, role, date, and ATS score, and can expand any entry to see the full resume that was submitted.

**Acceptance Scenarios**:

1. **Given** the Applications tab, **When** the user views it, **Then** they see a list of saved applications sorted by date (newest first), each showing: date applied, company, role title, before/after ATS score, and improvement percentage.
2. **Given** an application in the list, **When** the user expands it, **Then** they see the complete resume content (contact, all experiences with bullets, education, skills) and the original job description used.
3. **Given** one or more applications, **When** the user clicks "Export Applications", **Then** a dated JSON file is downloaded containing all application records; importing a JSON file merges records without creating duplicates.
4. **Given** an unwanted application record, **When** the user clicks delete on it and confirms, **Then** the record is permanently removed from the list.

---

### Edge Cases

- What happens when a job URL cannot be scraped (e.g., LinkedIn, JavaScript-rendered sites)? → System detects the failure and gracefully prompts the user to paste the job description manually.
- What happens when a resume file cannot be parsed (corrupted PDF, encrypted DOCX)? → System shows a clear error message identifying the file and suggests trying a different format.
- What happens when the fact bank is empty and the user tries to generate a resume? → System blocks generation and directs the user to add experience data to the fact bank first.
- What happens when AI generation takes longer than expected or fails mid-process? → System shows a loading state with step-by-step progress, and on failure displays a clear error with a retry option.
- What happens when the generated resume has very few keywords matching the job description? → System displays the low score prominently and suggests using Boost ATS mode; no minimum score is enforced.
- What happens when the user has experiences but no bullet points for a role? → System skips bullet rewriting for that experience and includes it with the original (empty) bullets.
- What happens when auto-trim still cannot fit the resume on one page? → System notifies the user that the resume is too long and asks them to manually remove content before downloading.

## Requirements *(mandatory)*

### Functional Requirements

**Fact Bank**
- **FR-001**: System MUST allow users to upload PDF, DOCX, and plain text resume files and automatically extract contact information, work experiences, education, skills, and projects.
- **FR-002**: System MUST support multiple title versions per work experience (same company, different role titles with separate bullet lists).
- **FR-003**: System MUST auto-save fact bank changes within 1 second of any edit, persisting data between sessions.
- **FR-004**: Users MUST be able to manually add, edit, and delete any fact bank entry (experience, education, skill, project, contact field).
- **FR-005**: System MUST allow fact bank export as a JSON file and import/restore from a previously exported JSON file.
- **FR-006**: When multiple resume files are uploaded, the system MUST merge experiences from the same company without creating duplicates.

**Job Description Input**
- **FR-007**: System MUST accept job description input via direct text paste OR via URL.
- **FR-008**: When a URL is provided, the system MUST attempt to automatically retrieve the job description text (supporting Greenhouse, Lever, Ashby HQ, and generic career pages); if retrieval fails, it MUST prompt the user to paste text manually with a clear explanation.

**Resume Generation**
- **FR-009**: System MUST run AI analysis on the job description to extract and categorize keywords: hard skills (2x ATS weight), title/function keywords (1.5x weight), action phrases, business context keywords (1x weight), domain terms, hard filters, and top 10 most important keywords.
- **FR-010**: System MUST select the best experience title version per company based on the job description's function and seniority level.
- **FR-011**: System MUST rewrite experience bullet points to naturally incorporate missing keywords with minimal edits, without fabricating facts, and maintaining the exact original bullet count per experience.
- **FR-012**: System MUST reorganize skills into 2–3 categories, front-loading keywords most relevant to the job description.
- **FR-013**: System MUST calculate and display an ATS match score before optimization and after, using weighted keyword coverage (0–100 scale).
- **FR-014**: System MUST display a keyword report showing: covered keywords, missing keywords, hard skills still missing, and top 10 keywords.

**Boost ATS Mode**
- **FR-015**: System MUST offer an optional "Boost ATS" mode that runs a more aggressive optimization pass to insert remaining business context and hard skill keywords where they fit naturally; keywords that cannot be placed naturally MUST NOT be force-inserted.

**Inline Editing**
- **FR-016**: Every text field in the generated resume MUST be directly editable in place by clicking on it.
- **FR-017**: Users MUST be able to recalculate the ATS score on demand after manual edits, without triggering a new AI API call.
- **FR-018**: Users MUST be able to delete individual bullet points or experience rows via hover-revealed delete controls.

**PDF Download**
- **FR-019**: System MUST generate and download a PDF using an ATS-safe format: no tables, no multi-column layouts, standard fonts, single-page output.
- **FR-020**: If the resume content exceeds one page, the system MUST automatically trim the lowest-value bullets (using AI ranking) until the resume fits on one page.
- **FR-021**: Downloading a PDF MUST automatically save the application to the Applications Log.

**Applications Log**
- **FR-022**: System MUST maintain an applications log recording: date, company, role, ATS score (before and after), full resume snapshot, and original job description.
- **FR-023**: Users MUST be able to expand any application record to view the complete resume content and job description.
- **FR-024**: Users MUST be able to delete individual application records.
- **FR-025**: System MUST allow export of all application records as a JSON file and import/merge from a previously exported file without creating duplicates.

### Key Entities

- **Fact Bank**: The user's complete professional history — contact information, multiple work experiences (each with one or more title versions and bullet points), education entries, skill groups, and projects. Persists across sessions.
- **Experience Version**: A specific title variant for a work experience at a company (e.g., "Product Manager" vs. "Senior Product Manager"), each with its own set of achievement bullets. Allows the AI to pick the most suitable presentation for each job.
- **Job Description**: The raw text content of a job posting, either scraped from a URL or pasted manually. Used as the basis for keyword extraction and resume tailoring.
- **Keyword Report**: The structured output of AI job description analysis — categorized keywords, weights, coverage status (before/after), and top 10 priority terms.
- **Generated Resume**: The AI-tailored output combining selected experience versions, rewritten bullets, and reorganized skills. Includes inline editing state and ATS scores.
- **Application Record**: A point-in-time snapshot of a submitted application — timestamp, company, role, before/after ATS scores, the full generated resume, and the job description used.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full workflow — upload resume → paste job description → generate tailored resume → download PDF — in under 5 minutes from a cold start.
- **SC-002**: AI resume generation completes and displays results within 30 seconds of the user clicking "Generate Resume" for a typical job description.
- **SC-003**: Generated resumes achieve a measurable improvement in ATS keyword coverage score compared to the original resume (positive delta displayed to user in every generation).
- **SC-004**: 90% of supported job posting URLs (Greenhouse, Lever, Ashby HQ) are successfully scraped without requiring manual text paste fallback.
- **SC-005**: Users can edit any resume field inline and recalculate the ATS score in under 2 seconds with no page reload or API call.
- **SC-006**: PDF downloads are delivered within 10 seconds and the resulting file opens as a properly formatted single-page document in standard PDF readers.
- **SC-007**: Fact bank data persists correctly across session reloads with zero data loss for at least 100 experience entries.
- **SC-008**: Users can locate any past application in the Applications Log and view the full resume snapshot in under 10 seconds.

## Assumptions

- The MFE will integrate with MyCircle's existing authentication — users must be signed in to access the feature; their data is stored under their user profile.
- AI-powered features (keyword extraction, bullet rewriting, generation pipeline) are handled by a new Cloud Function endpoint that proxies calls to an AI model — the OpenAI API key is stored as a Firebase secret (following the existing Firebase secrets pattern).
- Application and fact bank data are stored in Firestore under `users/{uid}/resumeTailor/` (fact bank document) and `users/{uid}/resumeApplications/{appId}` (application log) — not in localStorage, unlike the reference app, to support cross-device access.
- The AI model used for generation is configurable; the reference implementation uses GPT-4o but any compatible model with JSON output mode may be substituted.
- PDF generation is handled server-side (Cloud Function) since client-side PDF rendering is not feasible in a Module Federation MFE context.
- URL scraping is handled server-side to avoid CORS restrictions; supported platforms are Greenhouse, Lever, Ashby HQ, and generic career pages.
- The MFE follows all MyCircle conventions: i18n for all visible strings, dark mode support, responsive mobile-first layout, `<PageContent>` wrapper, and no `100vh` calculations.
