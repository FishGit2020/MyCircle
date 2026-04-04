# GraphQL Contract: HSA Expense Tracker

**Feature**: 025-hsa-expense-tracker | **Date**: 2026-04-04

## Types

```graphql
enum HSAExpenseCategory {
  MEDICAL
  DENTAL
  VISION
  PRESCRIPTION
  MENTAL_HEALTH
  LAB_TEST
  OTHER
}

enum HSAExpenseStatus {
  PENDING
  REIMBURSED
}

type HSAExpense {
  id: ID!
  provider: String!
  dateOfService: String!
  amountCents: Int!
  category: HSAExpenseCategory!
  description: String
  status: HSAExpenseStatus!
  receiptUrl: String
  receiptContentType: String
  createdAt: String!
  updatedAt: String!
}

input HSAExpenseInput {
  provider: String!
  dateOfService: String!
  amountCents: Int!
  category: HSAExpenseCategory!
  description: String
}

input HSAExpenseUpdateInput {
  provider: String
  dateOfService: String
  amountCents: Int
  category: HSAExpenseCategory
  description: String
}
```

## Query

```graphql
type Query {
  hsaExpenses: [HSAExpense!]!
}
```

Returns all HSA expenses for the authenticated user, ordered by `dateOfService` descending.

## Mutations

```graphql
type Mutation {
  addHsaExpense(input: HSAExpenseInput!): HSAExpense!
  updateHsaExpense(id: ID!, input: HSAExpenseUpdateInput!): HSAExpense!
  deleteHsaExpense(id: ID!): Boolean!
  markHsaExpenseReimbursed(id: ID!, reimbursed: Boolean!): HSAExpense!
}
```

| Mutation | Description |
|----------|-------------|
| `addHsaExpense` | Creates a new expense with status PENDING. Returns the created expense with server-generated id and timestamps. |
| `updateHsaExpense` | Updates one or more fields on an existing expense. Only provided fields are updated. Returns the updated expense. |
| `deleteHsaExpense` | Permanently deletes an expense and its receipt (if any) from storage. Returns true on success. |
| `markHsaExpenseReimbursed` | Sets status to REIMBURSED (reimbursed=true) or PENDING (reimbursed=false). Returns the updated expense. |

## REST Endpoint (Receipt Upload)

**Cloud Function**: `hsaExpenses` | **firebase.json rewrite**: `/hsa-expenses/**`

### POST /hsa-expenses/upload-receipt

Upload a receipt file to an existing expense.

**Request body** (JSON):
```json
{
  "expenseId": "string (required)",
  "fileBase64": "string (required, base64-encoded file data)",
  "fileName": "string (required)",
  "contentType": "string (required, one of: image/jpeg, image/png, application/pdf)"
}
```

**Response** (200):
```json
{
  "receiptUrl": "string (Firebase Storage download URL)",
  "receiptContentType": "string"
}
```

**Errors**: 401 (unauthenticated), 400 (validation), 413 (file too large, >5MB)

### POST /hsa-expenses/delete-receipt

Delete a receipt from an existing expense.

**Request body** (JSON):
```json
{
  "expenseId": "string (required)"
}
```

**Response** (200):
```json
{
  "ok": true
}
```

**Errors**: 401 (unauthenticated), 404 (expense not found or no receipt)
