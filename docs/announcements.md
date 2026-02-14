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

### Option A — Firebase Console (recommended for one-offs)

1. Open [Firebase Console](https://console.firebase.google.com/) → your project → **Firestore Database**
2. Navigate to the `announcements` collection (create it if first time)
3. Click **Add document** → Auto-ID
4. Add the fields:
   - `title` (string): `"Welcome to MyCircle!"`
   - `description` (string): `"Your personal dashboard for weather, stocks, podcasts, Bible reading, worship songs, notebooks, and AI chat."`
   - `icon` (string): `"announcement"`
   - `createdAt` (timestamp): select current date/time
5. Click **Save** — the badge appears for all users on next page load

### Option B — Firebase CLI (for scripting / CI)

```bash
# Install firebase-tools if needed
npm i -g firebase-tools

# Add a document via the REST API
firebase firestore:delete --help  # (no direct CLI create — use Admin SDK or REST)
```

For scripted creation, use the Admin SDK in a Node script:

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

initializeApp({ credential: cert('./service-account.json') });
const db = getFirestore();

await db.collection('announcements').add({
  title: 'Welcome to MyCircle!',
  description: 'Your personal dashboard for weather, stocks, podcasts, Bible reading, worship songs, notebooks, and AI chat.',
  icon: 'announcement',
  createdAt: Timestamp.now(),
});
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
