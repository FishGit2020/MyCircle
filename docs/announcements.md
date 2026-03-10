# Announcements ("What's New")

How to add, manage, and display in-app announcements via the "What's New" feature.

## Overview

Announcements are stored in the Firestore `announcements` collection. They are **public-read, admin-write** — any visitor can view them, but only Firebase admins can create or modify them. The shell app displays a sparkle icon in the header; a red badge appears when there are unread announcements.

## Document Schema

**Collection:** `announcements/{auto-id}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Short headline (e.g. "Worship Songs are here!") |
| `description` | `string` | Yes | One or two sentences describing the update |
| `icon` | `string` | No | Category badge — one of `feature`, `fix`, `improvement`, `announcement` |
| `createdAt` | `Timestamp` | Yes | Determines sort order (newest first) and display date |

### Icon Categories

| Value | Emoji | Use When |
|-------|-------|----------|
| `feature` | ✨ | A brand-new capability |
| `fix` | 🔧 | A bug fix users may have noticed |
| `improvement` | 🚀 | A performance or UX enhancement |
| `announcement` | 📢 | General news or maintenance notices |

## Adding an Announcement

### Default — gcloud REST API (recommended)

Uses your existing `gcloud` credentials. No service account or Firebase CLI token needed.

**Prerequisites:** `gcloud auth application-default login` (one-time setup)

```bash
TOKEN=$(gcloud auth application-default print-access-token) && curl -s -X POST \
  "https://firestore.googleapis.com/v1/projects/mycircle-dash/databases/(default)/documents/announcements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary @- <<'ENDJSON'
{
  "fields": {
    "title": {"stringValue": "Your Title Here"},
    "description": {"stringValue": "First paragraph.\n\nSecond paragraph.\n\nSupports emoji via JSON Unicode escapes."},
    "icon": {"stringValue": "announcement"},
    "createdAt": {"timestampValue": "YYYY-MM-DDTHH:MM:SSZ"}
  }
}
ENDJSON
```

**Tips:**
- For `createdAt`, use `$(date -u +%Y-%m-%dT%H:%M:%SZ)` to auto-fill current UTC time
- Emojis must use JSON Unicode escapes to avoid shell encoding issues (e.g. `\ud83d\uddfa\ufe0f` for 🗺️). Plain ASCII text works fine without escapes.
- Use `\n\n` for paragraph breaks in the description
- To **update** an existing announcement, change `POST` to `PATCH` and append `/{documentId}` to the URL

**Example — March 2026 update:**
```bash
TOKEN=$(gcloud auth application-default print-access-token) && curl -s -X POST \
  "https://firestore.googleapis.com/v1/projects/mycircle-dash/databases/(default)/documents/announcements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary @- <<'ENDJSON'
{
  "fields": {
    "title": {"stringValue": "March Update: 4 New Features + Recycle Bin"},
    "description": {"stringValue": "\ud83d\uddfa\ufe0f Trip Planner \u2014 Plan trips with itineraries and budgets.\n\n\ud83d\udcca Poll System \u2014 Create polls for family decisions.\n\n\ud83d\udcfb Radio Station \u2014 Stream live internet radio.\n\n\ud83d\uddd1\ufe0f Recycle Bin \u2014 Recover deleted items for 30 days."},
    "icon": {"stringValue": "feature"},
    "createdAt": {"timestampValue": "2026-03-10T05:48:54Z"}
  }
}
ENDJSON
```

## How Read Tracking Works

| User State | Storage | Key |
|------------|---------|-----|
| Signed in | Firestore `users/{uid}` | `lastSeenAnnouncementId` |
| Anonymous | localStorage | `last-seen-announcement` |

When the user opens the "What's New" modal, `markAllSeen()` saves the newest announcement ID to both localStorage and (if signed in) Firestore. The red badge clears.

## Key Files

| File | Role |
|------|------|
| `packages/shell/src/hooks/useAnnouncements.ts` | Fetch + read-tracking logic |
| `packages/shell/src/components/WhatsNew.tsx` | Modal UI |
| `packages/shell/src/components/WhatsNewButton.tsx` | Header button + badge |
| `packages/shell/src/lib/firebase.ts` | Firestore queries (`getAnnouncements`, `updateLastSeenAnnouncement`) |
| `firestore.rules` | Security rules (public read, no client write) |

## Tips

- Announcements are queried with `limit(20)` — older entries are still in Firestore but won't display. Archive or delete stale ones periodically.
- The `icon` field is optional; if omitted, the UI shows the announcement without a category badge.
- Announcements are **not** i18n-aware — the `title` and `description` are stored as-is. For multilingual support, consider adding `title_es`, `title_zh` fields and updating the hook.
