# Feature Spec: Immigration Tracker

**Status**: Implemented
**Package**: `packages/immigration-tracker`
**Route**: `/immigration`
**Port**: 3018

## Summary

USCIS immigration case status tracker that monitors case progress by receipt number. Allows users to add multiple cases and track their status through the immigration process, with case data stored in Firestore for persistence across devices.

## Key Features

- Track USCIS cases by receipt number
- Add/remove multiple cases
- Real-time case status display with form type and status description
- Case card display with status indicators
- Case status history tracking
- Form-based case addition with validation

## Data Sources

- **USCIS API**: Case status lookup by receipt number
- **Firestore**: `users/{uid}/immigrationCases/{caseId}` (saved cases)

## Integration Points

- **Shell route**: `/immigration` in App.tsx (requires auth)
- **Widget**: `immigration` in widgetConfig.ts
- **Nav group**: Family (`nav.group.family`)
- **i18n namespace**: `nav.immigration`, `immigration.*`
- **Firestore**: `users/{uid}/immigrationCases/{caseId}`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- USCIS case status API
- Firestore CRUD for case persistence
- Custom hooks for case data management
- TypeScript types in `types.ts`
- Utility functions in `utils/` directory

## Testing

- Unit tests: `packages/immigration-tracker/src/**/*.test.{ts,tsx}`
- E2E: `e2e/immigration-tracker.spec.ts`
