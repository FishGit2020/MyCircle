# Feature Spec: AI Interviewer

**Status**: Implemented
**Package**: `packages/ai-interviewer`
**Route**: `/interview`
**Port**: 3027

## Summary

AI-powered mock interview simulator with a split-panel interface showing questions and a chat-based response area. Provides rubric-based assessment of answers and session recording for review. Designed to help users practice for job interviews.

## Key Features

- Mock interview simulation with AI-generated questions
- Split panel layout: question panel + interview chat
- Rubric-based assessment and scoring of responses
- Session recording and playback for self-review
- Multiple interview types/categories
- Real-time AI feedback on answers

## Data Sources

- **Cloud Function**: `/interview-api/**` -> `interviewSessions`
- **Firebase Storage**: Interview session recordings

## Integration Points

- **Shell route**: `/interview` in App.tsx (requires auth)
- **Widget**: `aiInterviewer` in widgetConfig.ts
- **Nav group**: Learning (`nav.group.learning`)
- **i18n namespace**: `nav.interview`, `interview.*`
- **Cloud Function**: `/interview-api/**` -> `interviewSessions`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Cloud Function backend for AI interview logic
- Firebase Storage for session data
- Custom hooks for interview state management

## Testing

- Unit tests: `packages/ai-interviewer/src/**/*.test.{ts,tsx}`
- E2E: None (no dedicated e2e spec)
