# Feature Specification: HSA Expense Tracker

**Feature Branch**: `025-hsa-expense-tracker`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: Personal HSA (Health Savings Account) expense tracker to upload receipts, add expense details, and track reimbursement status for future claims.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add an HSA Expense (Priority: P1)

A user wants to record a new healthcare expense so they can track it for future HSA reimbursement. They open the HSA Expenses page, click "Add Expense", fill in the provider name, date of service, amount, and category (e.g., Medical, Dental, Vision), optionally add a description, and save the expense. The expense appears in their list with a "Pending" status.

**Why this priority**: This is the core value proposition. Without the ability to add expenses, no other feature matters. A user who can record expenses already gets value even without receipts or filtering.

**Independent Test**: Can be fully tested by creating a new expense with all required fields and verifying it appears in the expense list with correct details and "Pending" status.

**Acceptance Scenarios**:

1. **Given** the user is authenticated and on the HSA Expenses page, **When** they click "Add Expense" and fill in provider ("Dr. Smith"), date ("2026-03-15"), amount ("$125.00"), and category ("Medical"), **Then** the expense is saved and appears in the list showing "$125.00 - Dr. Smith - Medical - Pending".
2. **Given** the user is filling out the expense form, **When** they leave required fields empty (provider, date, amount), **Then** validation errors are shown and the form cannot be submitted.
3. **Given** the user enters an amount with decimal precision (e.g., "$45.99"), **Then** the amount is stored accurately and displayed correctly with two decimal places.

---

### User Story 2 - Upload and View Receipts (Priority: P2)

A user wants to attach a receipt image or PDF to an expense for record-keeping and future reimbursement claims. They select an existing expense (or upload during creation), drag-and-drop or browse for a file, and the receipt is uploaded and linked to the expense. They can later view the receipt by clicking on the expense.

**Why this priority**: Receipts are essential proof for HSA reimbursement claims. Without receipts, the tracker is just a list; with receipts, it becomes a complete reimbursement-ready record.

**Independent Test**: Can be tested by creating an expense, uploading an image receipt, and then viewing the expense detail to confirm the receipt displays correctly.

**Acceptance Scenarios**:

1. **Given** an expense exists without a receipt, **When** the user uploads a JPEG image under 5MB, **Then** the receipt is attached to the expense and a receipt indicator appears on the expense card.
2. **Given** an expense has a receipt attached, **When** the user opens the expense detail, **Then** the receipt image is displayed in a preview panel.
3. **Given** the user attempts to upload a file larger than 5MB, **Then** an error message is shown and the upload is rejected.
4. **Given** the user uploads a PDF receipt, **Then** the PDF is stored and can be viewed/downloaded from the expense detail.

---

### User Story 3 - Track Reimbursement Status (Priority: P2)

A user wants to mark expenses as reimbursed once they've submitted a claim and received payment, so they can distinguish between pending and completed reimbursements. They toggle an expense from "Pending" to "Reimbursed" status.

**Why this priority**: Tracking reimbursement status is the second core value after recording expenses. Users need to know what they've already claimed vs. what's still outstanding.

**Independent Test**: Can be tested by marking an existing expense as "Reimbursed" and verifying the status badge updates and the expense moves to the correct filter group.

**Acceptance Scenarios**:

1. **Given** an expense with "Pending" status, **When** the user marks it as reimbursed, **Then** the status changes to "Reimbursed" and the status badge updates visually.
2. **Given** an expense with "Reimbursed" status, **When** the user marks it back to "Pending", **Then** the status reverts and the display updates.

---

### User Story 4 - Search, Filter, and Summarize Expenses (Priority: P3)

A user wants to find specific expenses quickly and see a summary of their HSA spending. They can search by provider name, filter by category, year, or reimbursement status, and view a summary showing year totals, category breakdown, and pending vs. reimbursed amounts.

**Why this priority**: Filtering and summaries become valuable once the user has accumulated multiple expenses. They help at tax time and when deciding which expenses to submit for reimbursement.

**Independent Test**: Can be tested by creating several expenses across different categories and years, then using filters and verifying the summary numbers update correctly.

**Acceptance Scenarios**:

1. **Given** multiple expenses exist, **When** the user searches for "Dr. Smith", **Then** only expenses with "Dr. Smith" as provider are shown.
2. **Given** expenses across multiple categories, **When** the user filters by "Dental", **Then** only dental expenses are displayed and the summary updates to reflect only dental totals.
3. **Given** expenses from 2025 and 2026, **When** the user filters by year "2026", **Then** only 2026 expenses are shown.
4. **Given** a mix of pending and reimbursed expenses, **When** the user views the summary, **Then** totals for pending and reimbursed amounts are displayed separately.

---

### User Story 5 - Edit and Delete Expenses (Priority: P3)

A user wants to correct mistakes in expense entries or remove expenses that were entered in error. They can edit any field of an existing expense or delete an expense entirely.

**Why this priority**: Error correction is important for data accuracy but is a secondary workflow compared to initial data entry and receipt management.

**Independent Test**: Can be tested by editing an expense's amount and provider, then deleting a different expense, verifying changes persist.

**Acceptance Scenarios**:

1. **Given** an existing expense, **When** the user edits the amount from "$100.00" to "$150.00", **Then** the updated amount is saved and reflected in the list and summary.
2. **Given** an existing expense, **When** the user deletes it and confirms the deletion, **Then** the expense is permanently removed from the list and totals update.
3. **Given** the user clicks delete, **Then** a confirmation prompt appears before the expense is actually removed.

---

### Edge Cases

- What happens when the user has no expenses yet? An empty state with guidance on how to add the first expense is shown.
- What happens if the receipt upload fails mid-way (network interruption)? The expense is still saved without the receipt, and the user can retry the upload.
- What happens if the user enters "$0.00" as the amount? Validation rejects zero or negative amounts.
- What happens on a slow connection during receipt upload? A progress indicator or loading state is shown during upload.
- How does the system handle duplicate expenses? No automatic dedup; users manage their own entries. The edit/delete flow handles corrections.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to create HSA expenses with provider name, date of service, amount (in dollars/cents), and category.
- **FR-002**: System MUST support seven expense categories: Medical, Dental, Vision, Prescription, Mental Health, Lab/Test, and Other.
- **FR-003**: System MUST store expense amounts as integer cents internally and display them as formatted dollar amounts (e.g., "$125.99").
- **FR-004**: System MUST allow users to upload receipt files (images: JPEG, PNG; documents: PDF) up to 5MB per receipt.
- **FR-005**: System MUST display uploaded receipts in a detail view with image preview or PDF viewer.
- **FR-006**: System MUST support toggling expense status between "Pending" and "Reimbursed".
- **FR-007**: System MUST allow editing all fields of an existing expense (provider, date, amount, category, description).
- **FR-008**: System MUST allow deleting expenses with a confirmation step.
- **FR-009**: System MUST support searching expenses by provider name.
- **FR-010**: System MUST support filtering expenses by category, year, and reimbursement status.
- **FR-011**: System MUST display an expense summary showing year total, per-category breakdown, and pending vs. reimbursed totals.
- **FR-012**: System MUST restrict expense data access to the owning user only (user-scoped data).
- **FR-013**: System MUST validate required fields (provider, date, amount, category) before saving.
- **FR-014**: System MUST validate that amounts are positive numbers greater than zero.
- **FR-015**: System MUST show an empty state with guidance when no expenses exist.
- **FR-016**: System MUST be available as a dashboard widget showing recent expenses and pending total.
- **FR-017**: System MUST support dark mode, responsive layout (mobile-first), and accessibility standards (aria-labels, keyboard navigation, sufficient touch targets).

### Key Entities

- **HSA Expense**: A single healthcare expense record. Attributes: provider name, date of service, amount (cents), category, description (optional), reimbursement status (Pending/Reimbursed), receipt URL (optional), timestamps (created/updated).
- **Receipt**: A file (image or PDF) attached to an expense. Stored in cloud storage, referenced by URL in the expense record. Maximum 5MB per file.
- **Expense Category**: An enumeration of healthcare spending categories (Medical, Dental, Vision, Prescription, Mental Health, Lab/Test, Other).
- **Reimbursement Status**: A two-state flag (Pending, Reimbursed) indicating whether the expense has been claimed and paid back.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a new expense with all required fields in under 30 seconds.
- **SC-002**: Users can upload a receipt and see it attached to an expense in under 10 seconds (on standard broadband).
- **SC-003**: Users can find a specific expense via search or filter within 5 seconds, even with 100+ expenses.
- **SC-004**: The expense summary accurately reflects totals within 1 second of any expense change (add, edit, delete, status toggle).
- **SC-005**: 100% of expense data is user-scoped; no user can view or modify another user's expenses.
- **SC-006**: The page is fully usable on mobile screens (360px width and above) with all features accessible.
- **SC-007**: All interactive elements are keyboard-navigable and have appropriate accessibility labels.

## Assumptions

- Each expense has at most one receipt attachment. Multiple receipts per expense are not needed for the initial release.
- The expense tracker is a personal tool; there is no sharing, multi-user collaboration, or admin oversight of another user's expenses.
- No integration with external HSA providers or banks; reimbursement status is manually toggled by the user.
- No export functionality (CSV, PDF report) in the initial release; this can be added later.
- Receipt files are stored in Firebase Storage under a user-scoped path for security.
- The summary view is per-year; cross-year aggregate reports are not required initially.
