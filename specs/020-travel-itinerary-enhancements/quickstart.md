# Quickstart: Travel Itinerary Builder Enhancements

**Feature**: 020-travel-itinerary-enhancements
**Date**: 2026-03-31

---

## What Changes

This feature enhances two existing MFEs — no new packages, no new Cloud Functions, no new Firestore collections.

**`packages/trip-planner`**: Activity editing, activity notes form field, ticket cost tracking, trip status, packing checklist, trip duplication, itinerary export.

**`packages/travel-map`**: Confirm "Plan Trip" works on wishlist pins (likely already functional — needs test coverage verification).

**`packages/shared`**: ~17 new i18n keys in all three locale files (`en.ts`, `es.ts`, `zh.ts`).

---

## Dev Setup

No additional setup beyond the standard monorepo setup. Both MFEs run on existing ports.

```bash
# From repo root
pnpm install

# Run trip-planner in isolation
pnpm --filter @mycircle/trip-planner dev      # http://localhost:3024

# Run travel-map in isolation
pnpm --filter @mycircle/travel-map dev        # http://localhost:3019

# Run full shell + all MFEs
pnpm dev
```

---

## Key Files to Modify

| File | Change |
|---|---|
| `packages/trip-planner/src/types.ts` | Add `TripStatus`, `ChecklistItem`; add `cost?` to `Ticket`; add `checklist?` and `status?` to `Trip` |
| `packages/trip-planner/src/components/TripDetail.tsx` | Edit activity inline form, ticket cost, checklist section, duplicate, export, updated budget calc |
| `packages/trip-planner/src/components/TripForm.tsx` | Add status selector |
| `packages/trip-planner/src/components/TripList.tsx` | Status badge, richer summary card |
| `packages/trip-planner/src/components/ChecklistSection.tsx` | New component — checklist UI |
| `packages/shared/src/i18n/en.ts` | ~17 new `tripPlanner.*` keys |
| `packages/shared/src/i18n/es.ts` | Same keys in Spanish |
| `packages/shared/src/i18n/zh.ts` | Same keys in Chinese |

---

## Testing

```bash
# Rebuild shared (required after i18n changes)
pnpm build:shared

# Run trip-planner tests
pnpm --filter @mycircle/trip-planner test:run

# Run travel-map tests
pnpm --filter @mycircle/travel-map test:run

# Full suite
pnpm lint && pnpm test:run && pnpm typecheck
```

---

## Key Patterns

### Updating a trip field via the bridge

```ts
// In TripDetail.tsx — all trip updates go through the onUpdate prop
onUpdate(trip.id, { checklist: updatedChecklist });
onUpdate(trip.id, { status: 'confirmed' });
// No changes to useTrips.ts needed
```

### Adding a checklist item

```ts
const newItem: ChecklistItem = {
  id: crypto.randomUUID(),
  text: text.trim(),
  checked: false,
};
onUpdate(trip.id, { checklist: [...(trip.checklist || []), newItem] });
```

### Toggling a checklist item

```ts
const updated = (trip.checklist || []).map(item =>
  item.id === id ? { ...item, checked: !item.checked } : item
);
onUpdate(trip.id, { checklist: updated });
```

### Duplicating a trip

```ts
const duplicate: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'> = {
  ...structuredClone(trip),
  destination: trip.destination,
  startDate: '',
  endDate: '',
  status: 'planning',
  checklist: (trip.checklist || []).map(i => ({ ...i, id: crypto.randomUUID(), checked: false })),
  tickets: (trip.tickets || []).map(t => ({ ...t, id: crypto.randomUUID() })),
  itinerary: trip.itinerary.map(day => ({
    ...day,
    activities: day.activities.map(a => ({ ...a, id: crypto.randomUUID() })),
  })),
};
await addTrip(duplicate);
```

### Export to clipboard

```ts
const lines: string[] = [
  trip.destination,
  `Dates: ${trip.startDate || 'TBD'} → ${trip.endDate || 'TBD'}`,
  // ... build full text
];
try {
  await navigator.clipboard.writeText(lines.join('\n'));
  // Show "Copied!" toast
} catch {
  // Fallback: trigger .txt download
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trip.destination}-itinerary.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## i18n Notes

Spanish locale uses Unicode escapes — always read the relevant section before editing:

```bash
# Read current Spanish trip planner keys
grep -n "tripPlanner" packages/shared/src/i18n/es.ts
```

Never use emoji directly in `.ts` locale files — use Unicode escapes where needed.
