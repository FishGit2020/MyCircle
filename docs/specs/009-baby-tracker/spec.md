# Feature Spec: Baby Tracker

**Status**: Implemented
**Package**: `packages/baby-tracker`
**Route**: `/baby`
**Port**: 3011

## Summary

Week-by-week pregnancy tracker with milestone photo uploads, baby size comparisons, and Bible verses for each stage. Allows parents to document their pregnancy journey with photos stored in Firebase Storage and metadata in Firestore.

## Key Features

- Week-by-week pregnancy progress tracking
- Milestone photo upload and display
- Baby size comparisons for each gestational week
- Bible verses paired with each pregnancy stage
- Photo management via Cloud Function
- Stage-specific development information

## Data Sources

- **Cloud Function**: `/baby-photos/**` -> `babyPhotos` (photo upload/retrieval)
- **Firestore**: `users/{uid}/babyMilestones/{stageId}` (milestone metadata)
- **Firebase Storage**: Uploaded milestone photos
- **Local data**: Week-by-week pregnancy data in `data/` directory

## Integration Points

- **Shell route**: `/baby` in App.tsx (requires auth)
- **Widget**: `babyTracker` in widgetConfig.ts
- **Nav group**: Family (`nav.group.family`)
- **i18n namespace**: `nav.baby`, `baby.*`
- **Cloud Function**: `/baby-photos/**` -> `babyPhotos`
- **Firestore**: `users/{uid}/babyMilestones/{stageId}`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Firebase Storage for photo uploads
- Cloud Function for photo processing
- Custom hooks for milestone management
- Utility functions in `utils/` directory
- Static pregnancy data in `data/` directory

## Testing

- Unit tests: `packages/baby-tracker/src/**/*.test.{ts,tsx}`
- E2E: `e2e/baby-tracker.spec.ts`
