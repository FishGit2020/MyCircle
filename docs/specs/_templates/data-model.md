# Data Model: [Feature Name]

## Firestore Collections

### `users/{uid}/[collection]/{docId}`
```typescript
interface DocumentType {
  id: string;
  // ... fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Security Rules
```
match /users/{userId}/[collection]/{docId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## localStorage Keys
| Key (StorageKeys.*) | Type | Description |
|---------------------|------|-------------|
| FEATURE_KEY | string | ... |

## Window Events
| Event (WindowEvents.*) | Trigger | Payload |
|------------------------|---------|---------|
| FEATURE_CHANGED | On data update | none |
