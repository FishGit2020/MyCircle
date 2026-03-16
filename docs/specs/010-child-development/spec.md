# Feature Spec: Child Development

**Status**: Implemented
**Package**: `packages/child-development`
**Route**: `/child-dev`
**Port**: 3012

## Summary

Developmental milestone tracker based on 195 CDC/AAP milestones across 5 domains and 9 age ranges. Helps parents monitor their child's development with red flag indicators and a timeline view. Supports multiple children with progress stored in Firestore.

## Key Features

- 195 CDC/AAP developmental milestones
- 5 developmental domains (social/emotional, language/communication, cognitive, movement/physical, general)
- 9 age ranges from 2 months to 5 years
- Red flag indicators for potential developmental concerns
- Timeline view of milestone achievements
- Youth timeline for older children
- Multiple child profiles support
- Progress tracking with check-off milestones

## Data Sources

- **localStorage**: Local milestone progress cache
- **Firestore**: `users/{uid}/children/{childId}` (child profiles and progress)
- **Local data**: CDC/AAP milestone data in `data/` directory

## Integration Points

- **Shell route**: `/child-dev` in App.tsx (requires auth)
- **Widget**: `childDev` in widgetConfig.ts
- **Nav group**: Family (`nav.group.family`)
- **i18n namespace**: `nav.childDev`, `childDev.*`
- **Firestore**: `users/{uid}/children/{childId}`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Static milestone data sourced from CDC/AAP guidelines
- Timeline visualization components (TimelineView, YouthTimeline)
- Firestore persistence for child profiles

## Testing

- Unit tests: `packages/child-development/src/**/*.test.{ts,tsx}`
- E2E: `e2e/child-development.spec.ts`
