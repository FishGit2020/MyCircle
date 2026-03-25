# REST API Contract: Resume Tailor AI (015)

**Phase**: 1 — Design
**Date**: 2026-03-25

---

## Justification for REST

These REST endpoints are justified under Constitution Principle III exceptions:
1. **Binary file input** (`/resume-tailor/upload`) — resume files (PDF/DOCX) are binary data; follows the established `cloudFiles` and `babyPhotos` patterns
2. **No other REST endpoints needed** — AI generation, URL scraping, and data CRUD go through GraphQL

---

## POST /resume-tailor/upload

**Purpose**: Accept a resume file (PDF, DOCX, or plain text), parse it server-side, and return extracted structured data as a partial fact bank.

**Auth**: Firebase ID token in `Authorization: Bearer <token>` header (required)

**Rate limit**: 10 requests/min per IP (same pattern as `babyPhotos`)

**Request**:
```json
{
  "fileName": "resume.pdf",
  "fileBase64": "<base64-encoded file content>",
  "contentType": "application/pdf"
}
```

**Allowed content types**:
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
- `application/msword` (DOC)
- `text/plain`

**Max file size**: 5MB (after base64 decode)

**Response (success — 200)**:
```json
{
  "contact": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "555-0100",
    "location": "San Francisco, CA",
    "linkedin": "https://linkedin.com/in/janedoe",
    "github": null,
    "website": null
  },
  "experiences": [
    {
      "id": "exp-uuid-1",
      "company": "Acme Corp",
      "location": "San Francisco, CA",
      "startDate": "Jan 2022",
      "endDate": "Present",
      "versions": [
        {
          "id": "ver-uuid-1",
          "title": "Senior Product Manager",
          "bullets": [
            "Led cross-functional team of 8 to launch mobile payment feature",
            "Increased user retention by 23% through A/B tested onboarding redesign"
          ]
        }
      ]
    }
  ],
  "education": [
    {
      "id": "edu-uuid-1",
      "school": "University of California, Berkeley",
      "location": "Berkeley, CA",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "startDate": "2014",
      "endDate": "2018",
      "notes": []
    }
  ],
  "skills": [
    "Product: Roadmapping, A/B Testing, User Research",
    "Technical: SQL, Python, Figma"
  ],
  "projects": []
}
```

**Response (error — 400)**:
```json
{ "error": "Unsupported file type. Please upload a PDF, DOCX, or text file." }
```

**Response (error — 413)**:
```json
{ "error": "File exceeds 5MB limit. Please compress the file and try again." }
```

**Response (error — 401)**:
```json
{ "error": "Authentication required" }
```

**Response (error — 500)**:
```json
{ "error": "Could not extract text from this file. Please try pasting your resume as text instead." }
```

**Implementation notes**:
- New Cloud Function exported as `resumeTailor` from `functions/src/index.ts`
- `firebase.json` rewrite required: `{ "source": "/resume-tailor/**", "function": "resumeTailor" }`
- Server uses `pdfjs-dist` (legacy build) for PDF text extraction
- Server uses `mammoth` for DOCX → plain text extraction
- After text extraction, the AI model (`openai` SDK, already in `functions/package.json`) is called to structure the text into the fact bank JSON format (same prompt pattern as the reference implementation's `parseResumeWithAI`)
- Extracted data is returned to the client; the client then calls `saveResumeFactBank` GraphQL mutation to persist it

---

## `firebase.json` Hosting Rewrite

Add before the catch-all `** → /index.html` rule:

```json
{
  "source": "/resume-tailor/**",
  "function": "resumeTailor"
}
```

---

## Window Bridge API

The `resumeTailor` REST endpoint is called via a window bridge initialized in the Shell (same pattern as `window.__cloudFiles`):

```typescript
// Initialized in packages/shell/src/lib/firebase.ts
window.__resumeTailor = {
  uploadAndParse: async (fileName: string, fileBase64: string, contentType: string) => {
    const token = await auth.currentUser!.getIdToken();
    const res = await fetch('/resume-tailor/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ fileName, fileBase64, contentType }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },
};
```

**MFE usage**:
```typescript
const parsed = await (window as any).__resumeTailor.uploadAndParse(file.name, base64, file.type);
// Then merge into fact bank state and call saveResumeFactBank mutation
```
