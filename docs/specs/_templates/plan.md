# Implementation Plan: [Feature Name]

**Status**: Draft | Approved | In Progress | Complete

## Architecture Decision

### Approach
[Describe the chosen approach and why]

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Option A | ... | ... | Chosen |
| Option B | ... | ... | Rejected because... |

## Key Dependencies
- External APIs: [list with links]
- Shared hooks/utils: [from @mycircle/shared]
- Cloud Functions: [if needed]
- Firestore collections: [paths]

## Integration Points
- Shell route: `/route`
- Dev port: XXXX
- Widget: [type] in widgetConfig.ts
- Nav group: [group] in navConfig.ts
- i18n namespace: `feature.*`
- Cloud Function: `/api-path/**` (if applicable)
- Firestore rules: [if new subcollections needed]

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Risk 1 | High | Mitigation strategy |
