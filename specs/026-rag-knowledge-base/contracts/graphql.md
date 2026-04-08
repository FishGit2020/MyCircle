# GraphQL Contracts: RAG Knowledge Base

**Feature**: 026-rag-knowledge-base  
**Date**: 2026-04-04

## Schema Types

```graphql
type KnowledgeSource {
  id: ID!
  title: String!
  sourceUrl: String
  chunkCount: Int!
  embedModel: String!
  createdAt: String!
}

type KnowledgeSearchResult {
  id: ID!
  text: String!
  sourceTitle: String!
  sourceUrl: String
  score: Float!
}

type IngestResult {
  sourceId: ID!
  title: String!
  chunkCount: Int!
}
```

## Queries

### knowledgeSources

Returns all knowledge sources for the authenticated user.

```graphql
type Query {
  knowledgeSources: [KnowledgeSource!]!
}
```

**Auth**: Required (uid from context)  
**Errors**: `UNAUTHENTICATED` if no auth  
**Behavior**: Returns empty array if no sources exist

### ragSearch

Embeds the question and searches the user's knowledge base for similar chunks.

```graphql
type Query {
  ragSearch(
    question: String!
    endpointId: ID
    embedModel: String!
    topK: Int
  ): [KnowledgeSearchResult!]!
}
```

**Auth**: Required  
**Defaults**: `topK` defaults to 5  
**Errors**:
- `UNAUTHENTICATED` if no auth
- `BAD_USER_INPUT` if question is empty
- `INTERNAL_SERVER_ERROR` if embedding endpoint unreachable
- Returns empty array if knowledge base is empty

## Mutations

### ingestKnowledgeDoc

Chunks text, generates embeddings via Ollama, stores chunks in Firebase Storage and metadata in Firestore.

```graphql
type Mutation {
  ingestKnowledgeDoc(
    title: String!
    content: String!
    sourceUrl: String
    endpointId: ID
    embedModel: String!
  ): IngestResult!
}
```

**Auth**: Required  
**Validation**:
- `title`: Non-empty, max 200 chars
- `content`: Non-empty, min 50 chars
- `embedModel`: Non-empty
**Errors**:
- `UNAUTHENTICATED` if no auth
- `BAD_USER_INPUT` if validation fails
- `INTERNAL_SERVER_ERROR` if embedding endpoint unreachable or storage write fails
**Atomicity**: If embedding fails mid-way, no partial data is written to storage or Firestore

## Frontend Query Definitions

To be added to `packages/shared/src/apollo/queries.ts`:

```typescript
export const INGEST_KNOWLEDGE_DOC = gql`
  mutation IngestKnowledgeDoc(
    $title: String!
    $content: String!
    $sourceUrl: String
    $endpointId: ID
    $embedModel: String!
  ) {
    ingestKnowledgeDoc(
      title: $title
      content: $content
      sourceUrl: $sourceUrl
      endpointId: $endpointId
      embedModel: $embedModel
    ) {
      sourceId
      title
      chunkCount
    }
  }
`;

export const GET_KNOWLEDGE_SOURCES = gql`
  query GetKnowledgeSources {
    knowledgeSources {
      id
      title
      sourceUrl
      chunkCount
      embedModel
      createdAt
    }
  }
`;

export const RAG_SEARCH = gql`
  query RagSearch(
    $question: String!
    $endpointId: ID
    $embedModel: String!
    $topK: Int
  ) {
    ragSearch(
      question: $question
      endpointId: $endpointId
      embedModel: $embedModel
      topK: $topK
    ) {
      id
      text
      sourceTitle
      sourceUrl
      score
    }
  }
`;
```
