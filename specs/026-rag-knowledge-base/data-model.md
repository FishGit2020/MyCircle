# Data Model: RAG Knowledge Base

**Feature**: 026-rag-knowledge-base  
**Date**: 2026-04-04

## Entities

### KnowledgeChunk (Firebase Storage)

Stored as JSON array in `users/{uid}/knowledge-base.json`.

| Field       | Type       | Required | Description                                      |
|-------------|------------|----------|--------------------------------------------------|
| id          | string     | Yes      | UUID, unique per chunk                           |
| text        | string     | Yes      | Chunk text content (~1500 chars max)             |
| sourceId    | string     | Yes      | References the KnowledgeSource this belongs to   |
| sourceTitle | string     | Yes      | Denormalized title for display in search results |
| sourceUrl   | string     | No       | Denormalized URL for display in search results   |
| embedding   | number[]   | Yes      | Vector embedding (dimension depends on model)    |
| embedModel  | string     | Yes      | Model used to generate embedding (e.g., "nomic-embed-text") |

**Storage format**: Single JSON file per user. Entire file is read for search (brute-force similarity). File is overwritten atomically on ingestion (read-modify-write).

**Example**:
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "text": "React 18 introduced concurrent features including useTransition...",
    "sourceId": "src-001",
    "sourceTitle": "React 18 Documentation",
    "sourceUrl": "https://react.dev/blog/2022/03/29/react-v18",
    "embedding": [0.12, -0.03, 0.45, ...],
    "embedModel": "nomic-embed-text"
  }
]
```

### KnowledgeSource (Firestore)

Collection path: `users/{uid}/knowledgeMeta/{sourceId}`

| Field      | Type      | Required | Description                                  |
|------------|-----------|----------|----------------------------------------------|
| id         | string    | Yes      | Auto-generated document ID                   |
| title      | string    | Yes      | User-provided document title                 |
| sourceUrl  | string    | No       | Optional URL of the source                   |
| chunkCount | number    | Yes      | Number of chunks created from this source    |
| embedModel | string    | Yes      | Embedding model used during ingestion        |
| createdAt  | Timestamp | Yes      | Server timestamp at ingestion time           |

**Validation rules**:
- `title`: Non-empty, max 200 characters
- `sourceUrl`: Valid URL format if provided
- `chunkCount`: Positive integer

### SearchResult (ephemeral, GraphQL response only)

| Field       | Type   | Description                                  |
|-------------|--------|----------------------------------------------|
| id          | string | Chunk ID                                     |
| text        | string | Chunk text content                           |
| sourceTitle | string | Title of the source document                 |
| sourceUrl   | string | URL of the source (nullable)                 |
| score       | number | Similarity score (0.0 to 1.0 for normalized) |

## Relationships

```
User (1) ──── (1) knowledge-base.json [Firebase Storage]
  │                    │
  │                    └── contains: KnowledgeChunk[] (many)
  │
  └──── (many) KnowledgeSource [Firestore: users/{uid}/knowledgeMeta/]
                    │
                    └── referenced by: KnowledgeChunk.sourceId
```

## State Transitions

### Ingestion Flow
```
[User submits text] → [Validation] → [Chunking] → [Embedding (per chunk)] → [Storage write] → [Metadata write] → [Success]
                          │                              │                         │
                          ▼                              ▼                         ▼
                      [Error: invalid input]     [Error: endpoint unreachable] [Error: storage failure]
                                                  (no partial data written)
```

### Search Flow
```
[User submits question] → [Embed question] → [Download chunks JSON] → [Dot product similarity] → [Sort + top-K] → [Return results]
                               │                     │
                               ▼                     ▼
                          [Error: endpoint]    [Empty KB → message]
```

## Security Rules (Firestore)

```
match /users/{uid}/knowledgeMeta/{sourceId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

Firebase Storage rules for `users/{uid}/knowledge-base.json`:
```
match /users/{uid}/knowledge-base.json {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

Note: In practice, Cloud Functions use Admin SDK which bypasses security rules. These rules protect against direct client access.
