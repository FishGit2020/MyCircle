# Resume Tailor — Feature Specification

**Status**: Approved
**Feature**: 015-resume-tailor
**Package**: `@mycircle/resume-tailor`
**Route**: `/resume`

## Overview

An AI-powered resume builder MFE that helps users maintain a structured fact bank of their career history and generate tailored, ATS-optimized resumes from job descriptions.

## User Stories

### US1 — Fact Bank Management (P1)
As a job seeker, I want to maintain a persistent structured repository of my career history (experiences, education, skills, projects) so I can quickly generate targeted resumes without re-entering information.

**Acceptance criteria:**
- User can upload a PDF, DOCX, or text resume and have it automatically parsed into the fact bank
- User can add, edit, and delete experience entries with multiple version titles
- User can add, edit, and delete education, skills, and project entries
- Changes are auto-saved (debounced) with visual save status feedback
- User can export/import the fact bank as JSON

### US2 — AI Resume Generation (P1)
As a job seeker, I want to generate a tailored resume from a job description so that my resume matches the employer's requirements and passes ATS screening.

**Acceptance criteria:**
- User can paste or URL-scrape a job description
- AI generates a resume selecting the best experience versions and rewriting bullets
- ATS score (0-100) is displayed with matched/missing keyword breakdown
- User can run Boost Mode to iteratively improve the ATS score
- Generated resume shows keyword report (hard skills, title keywords, business context)

### US3 — PDF Download (P2)
As a job seeker, I want to download my generated resume as a PDF so I can submit it to employers.

**Acceptance criteria:**
- Browser print dialog opens with resume formatted for print
- Print CSS hides UI chrome, shows only the resume document
- Resume is formatted with standard sections (contact, experience, education, skills, projects)

### US4 — Inline Editing (P2)
As a job seeker, I want to edit generated resume bullets directly in the preview so I can fine-tune the AI output before printing.

**Acceptance criteria:**
- Bullet points in the generated resume are contenteditable
- Changes are captured on blur and stored in component state

### US5 — Application Log (P3)
As a job seeker, I want to track my job applications with their ATS scores and status so I can monitor my job search progress.

**Acceptance criteria:**
- Generated resumes can be saved to the application log with job title and company
- Applications display ATS score, status (applied/interview/offer/rejected/withdrawn), and date
- Status can be updated; notes can be added per application
- Applications can be deleted

## Technical Context

- **Package**: `packages/resume-tailor/` — Vite Module Federation, port 3023, name `resumeTailor`
- **Storage**: Firestore `users/{uid}/resumeFactBank/default` + `users/{uid}/resumeApplications/{appId}`
- **AI**: OpenAI GPT-4o via existing `OPENAI_API_KEY` Firebase secret
- **File upload**: REST `POST /resume-tailor/upload` (justified: binary file upload)
- **All other data**: GraphQL mutations/queries via `@mycircle/shared`
