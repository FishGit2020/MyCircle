# Feature Spec: Notebook

**Status**: Implemented
**Package**: `packages/notebook`
**Route**: `/notebook`, `/notebook/new`, `/notebook/:noteId`
**Port**: 3010

## Summary

Personal notes application with full CRUD operations, a publish-to-public feature, and search/filter capabilities. Notes are stored per-user in Firestore with the option to share publicly. Supports creating, editing, viewing, and deleting notes.

## Key Features

- Create, read, update, and delete personal notes
- Rich note editor with title and content
- Note list with card-based display
- Search and filter notes by content
- Publish notes to public (visible to all users)
- Deep-link to specific notes via `/notebook/:noteId`
- Soft delete with recycle bin integration

## Data Sources

- **Firestore**: `users/{uid}/notes` (private per-user notes)
- **Firestore**: `publicNotes` collection (published notes)

## Integration Points

- **Shell route**: `/notebook`, `/notebook/new`, `/notebook/:noteId` in App.tsx (requires auth)
- **Widget**: `notebook` in widgetConfig.ts
- **Nav group**: Workspace (`nav.group.workspace`)
- **i18n namespace**: `nav.notebook`, `notebook.*`
- **Firestore**: `users/{uid}/notes/{noteId}`, `publicNotes/{noteId}`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Firestore CRUD operations
- Custom hooks for note management
- TypeScript types in `types.ts`

## Testing

- Unit tests: `packages/notebook/src/**/*.test.{ts,tsx}`
- E2E: `e2e/notebook.spec.ts`
