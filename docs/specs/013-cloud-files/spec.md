# Feature Spec: Cloud Files

**Status**: Implemented
**Package**: `packages/cloud-files`
**Route**: `/files`
**Port**: 3017

## Summary

File management system with upload, download, and sharing capabilities. Provides a "My Files" view for personal storage and a "Shared Files" view for files shared between users. Files are stored in Firebase Storage with metadata tracked in Firestore.

## Key Features

- File upload with drag-and-drop support
- File list with card-based display (FileCard)
- My Files (personal) and Shared Files (collaborative) views
- File download and sharing
- File metadata management
- Integration with Doc Scanner MFE (scanned documents can be saved here)

## Data Sources

- **Cloud Function**: `/cloud-files/**` -> `cloudFiles` (upload, download, share operations)
- **Firestore**: `users/{uid}/files/{fileId}` (private file metadata)
- **Firestore**: `sharedFiles/{fileId}` (shared file metadata)
- **Firebase Storage**: Actual file binary storage

## Integration Points

- **Shell route**: `/files` in App.tsx (requires auth)
- **Widget**: `cloudFiles` in widgetConfig.ts
- **Nav group**: Workspace (`nav.group.workspace`)
- **i18n namespace**: `nav.cloudFiles`, `cloudFiles.*`
- **Cloud Function**: `/cloud-files/**` -> `cloudFiles`
- **Firestore**: `users/{uid}/files/{fileId}`, `sharedFiles/{fileId}`
- **Cross-MFE**: Doc Scanner saves scanned documents to Cloud Files

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Firebase Storage for file binary data
- Cloud Function for secure file operations
- Custom hooks for file management
- TypeScript types in `types.ts`
- Utility functions in `utils/` directory

## Testing

- Unit tests: `packages/cloud-files/src/**/*.test.{ts,tsx}` (component-level)
- E2E: `e2e/cloud-files.spec.ts`
