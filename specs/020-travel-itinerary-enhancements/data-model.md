# Data Model: Travel Itinerary Builder Enhancements

**Feature**: 020-travel-itinerary-enhancements
**Date**: 2026-03-31

---

## Overview

All changes are additive to the existing `Trip` document stored in Firestore at `users/{uid}/trips/{tripId}`. No new collections, subcollections, or documents are introduced.

---

## Updated TypeScript Types (`packages/trip-planner/src/types.ts`)

### `TripStatus` — new

```ts
export type TripStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled';
```

Default value: `'planning'`

### `ChecklistItem` — new

```ts
export interface ChecklistItem {
  id: string;       // crypto.randomUUID()
  text: string;     // required, non-empty after trim
  checked: boolean; // default: false
}
```

### `Activity` — updated

Added one optional field:

```
notes?: string;   // free-text, max ~1000 chars (soft guideline, not enforced)
```

Before: `{ id, time, title, location, notes, cost }` — **notes was already in the type** but not surfaced in the UI.

After: **no type change needed** — `notes` is already defined. Only the UI form needs updating.

### `Ticket` — updated

Added one optional field:

```
cost?: number;   // non-negative; 0 = no cost tracked; default: 0
```

Full updated interface:
```ts
export interface Ticket {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'boat' | 'other';
  description: string;
  date: string;
  cost?: number;   // ← NEW
}
```

### `Trip` — updated

Added two optional fields:

```ts
export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string;
  budget: number;
  currency: string;
  lat?: number;
  lon?: number;
  itinerary: ItineraryDay[];
  tickets?: Ticket[];
  checklist?: ChecklistItem[];   // ← NEW
  status?: TripStatus;           // ← NEW (optional for backwards compat with existing records)
  createdAt: number;
  updatedAt: number;
}
```

Both new fields are optional for backwards compatibility — existing Firestore documents without them will continue to render correctly (checklist defaults to `[]`, status defaults to `'planning'` in display logic).

---

## Firestore Document Shape (after changes)

**Collection**: `users/{uid}/trips`
**Document ID**: auto-generated

```json
{
  "destination": "Paris",
  "startDate": "2026-06-01",
  "endDate": "2026-06-07",
  "notes": "Anniversary trip",
  "budget": 3000,
  "currency": "EUR",
  "lat": 48.8566,
  "lon": 2.3522,
  "status": "confirmed",
  "checklist": [
    { "id": "abc123", "text": "Book hotel", "checked": true },
    { "id": "def456", "text": "Pack charger", "checked": false }
  ],
  "itinerary": [
    {
      "date": "2026-06-01",
      "activities": [
        {
          "id": "act-001",
          "time": "09:00",
          "title": "Eiffel Tower",
          "location": "Champ de Mars",
          "notes": "Pre-book skip-the-line tickets",
          "cost": 30
        }
      ]
    }
  ],
  "tickets": [
    {
      "id": "tkt-001",
      "type": "flight",
      "description": "CDG → JFK",
      "date": "2026-06-07",
      "cost": 650
    }
  ],
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

---

## Budget Calculation Change

**Before**: `totalSpent = sum of all activity.cost across all itinerary days`

**After**: `totalSpent = sum of activity costs + sum of ticket costs`

```ts
const activitySpend = trip.itinerary.reduce(
  (sum, day) => sum + day.activities.reduce((s, a) => s + (a.cost || 0), 0), 0
);
const ticketSpend = (trip.tickets || []).reduce((s, t) => s + (t.cost || 0), 0);
const totalSpent = activitySpend + ticketSpend;
```

This change is in `TripDetail.tsx` only.

---

## State Transitions: TripStatus

```
planning → confirmed → completed
planning → cancelled
confirmed → cancelled
completed → (terminal — no transitions out, but user can manually change via form)
cancelled → (terminal — same caveat)
```

No server-side enforcement of transitions. Status is a UI-level field the user sets freely.

---

## Duplication Mapping

When duplicating a trip, fields are mapped as follows:

| Source field | Destination field | Transform |
|---|---|---|
| `destination` | `destination` | unchanged |
| `notes` | `notes` | unchanged |
| `budget` | `budget` | unchanged |
| `currency` | `currency` | unchanged |
| `lat`, `lon` | `lat`, `lon` | unchanged |
| `itinerary` | `itinerary` | deep copy; each `Activity.id` regenerated with `crypto.randomUUID()` |
| `tickets` | `tickets` | deep copy; each `Ticket.id` regenerated |
| `checklist` | `checklist` | deep copy; each `ChecklistItem.id` regenerated; all `checked` → `false` |
| `status` | `status` | reset to `'planning'` |
| `startDate` | `startDate` | cleared (empty string) |
| `endDate` | `endDate` | cleared (empty string) |

The duplicated trip is immediately saved via `addTrip`. The user is then navigated to the new trip's edit form (TripForm) to fill in dates.

---

## No Firestore Rules Changes

The existing Firestore rule for `users/{uid}/trips` already allows authenticated owners full read/write. New fields are within the same document — no rule change needed.

No new subcollections, no public collections.
