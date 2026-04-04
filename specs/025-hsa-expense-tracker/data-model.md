# Data Model: HSA Expense Tracker

**Feature**: 025-hsa-expense-tracker | **Date**: 2026-04-04

## Entities

### HSAExpense

**Firestore path**: `users/{uid}/hsaExpenses/{expenseId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (doc ID) | auto | Firestore document ID |
| provider | string | yes | Healthcare provider name (e.g., "Dr. Smith") |
| dateOfService | string (ISO date) | yes | Date the service was rendered (YYYY-MM-DD) |
| amountCents | integer | yes | Expense amount in cents (e.g., 12500 = $125.00). Must be > 0. |
| category | HSAExpenseCategory | yes | Expense category enum value |
| description | string | no | Optional notes about the expense |
| status | HSAExpenseStatus | yes | Reimbursement status. Default: "PENDING" |
| receiptUrl | string | no | Firebase Storage download URL for the receipt file |
| receiptStoragePath | string | no | Firebase Storage path for deletion (e.g., `users/{uid}/hsa-receipts/{expenseId}/receipt.pdf`) |
| receiptContentType | string | no | MIME type of the receipt (e.g., "image/jpeg", "application/pdf") |
| createdAt | Timestamp | auto | Server timestamp on creation |
| updatedAt | Timestamp | auto | Server timestamp on every update |

### HSAExpenseCategory (Enum)

| Value | Display Label |
|-------|--------------|
| MEDICAL | Medical |
| DENTAL | Dental |
| VISION | Vision |
| PRESCRIPTION | Prescription |
| MENTAL_HEALTH | Mental Health |
| LAB_TEST | Lab / Test |
| OTHER | Other |

### HSAExpenseStatus (Enum)

| Value | Display Label |
|-------|--------------|
| PENDING | Pending |
| REIMBURSED | Reimbursed |

## State Transitions

```
[New Expense] → PENDING
PENDING ↔ REIMBURSED  (toggleable via markHsaExpenseReimbursed mutation)
Any status → [Deleted]  (via deleteHsaExpense mutation)
```

## Validation Rules

| Rule | Field(s) | Constraint |
|------|----------|-----------|
| Required fields | provider, dateOfService, amountCents, category | Must be present and non-empty |
| Positive amount | amountCents | Must be integer > 0 |
| Valid category | category | Must be one of HSAExpenseCategory values |
| Valid status | status | Must be one of HSAExpenseStatus values |
| Receipt size | (upload) | File must be ≤ 5MB |
| Receipt type | (upload) | Must be image/jpeg, image/png, or application/pdf |
| Date format | dateOfService | Must be valid ISO date string (YYYY-MM-DD) |

## Relationships

- **HSAExpense → Receipt**: One-to-one (optional). Receipt is stored in Firebase Storage and referenced by `receiptUrl` and `receiptStoragePath` fields on the expense document.
- **HSAExpense → User**: Many-to-one. Implicit via Firestore path `users/{uid}/hsaExpenses/{expenseId}`.

## Indexes

No composite indexes needed initially — queries will filter client-side from a full collection fetch (same pattern as cloud-files). If the collection grows large, a composite index on `(status, dateOfService desc)` could be added later.
