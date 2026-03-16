# Feature Spec: Poll System

**Status**: Implemented
**Package**: `packages/poll-system`
**Route**: `/polls`
**Port**: 3025

## Summary

Community polling system that allows users to create polls, vote on options, and view real-time results. Polls are stored in Firestore and accessible to all authenticated users, enabling community engagement and decision-making.

## Key Features

- Create polls with multiple choice options
- Vote on active polls (one vote per user)
- Real-time results display with vote counts and percentages
- Poll list view with status indicators
- Poll detail view with voting interface
- Poll form for creating new polls
- Active/closed poll status management

## Data Sources

- **Firestore**: `polls/{pollId}` (community-wide poll data including votes)

## Integration Points

- **Shell route**: `/polls` in App.tsx (requires auth)
- **Widget**: `pollSystem` in widgetConfig.ts
- **Nav group**: Family (`nav.group.family`)
- **i18n namespace**: `nav.pollSystem`, `polls.*`
- **Firestore**: `polls/{pollId}`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Firestore real-time listeners for live vote updates
- Custom hooks for poll management and voting
- TypeScript types in `types.ts`

## Testing

- Unit tests: `packages/poll-system/src/**/*.test.{ts,tsx}`
- E2E: None (no dedicated e2e spec)
