# Data Model: Anniversary Tracker

**Branch**: `027-anniversary-mfe` | **Date**: 2026-04-09

## Entities

### Anniversary

Top-level Firestore collection: `anniversaries/{anniversaryId}`

| Field            | Type              | Required | Description                                      |
|------------------|-------------------|----------|--------------------------------------------------|
| id               | string (auto)     | yes      | Firestore document ID                            |
| ownerUid         | string            | yes      | Firebase Auth UID of the creator                 |
| ownerDisplayName | string            | yes      | Display name of the owner (denormalized)         |
| title            | string            | yes      | Anniversary title (e.g., "Our Wedding")          |
| originalDate     | timestamp         | yes      | The original anniversary date                    |
| location         | Location \| null  | no       | Where the original event took place              |
| contributorUids  | string[]          | yes      | Array of contributor Firebase Auth UIDs (empty by default) |
| contributors     | ContributorInfo[] | yes      | Array of contributor display info (empty by default) |
| createdAt        | timestamp         | yes      | Document creation time                           |
| updatedAt        | timestamp         | yes      | Last modification time                           |

### AnniversaryYear

Subcollection: `anniversaries/{anniversaryId}/years/{yearNumber}`

| Field       | Type             | Required | Description                                         |
|-------------|------------------|----------|-----------------------------------------------------|
| yearNumber  | number           | yes      | Year number (0 = original event, 1 = first anniversary, etc.) |
| year        | number           | yes      | Calendar year (e.g., 2021)                          |
| activity    | string \| null   | no       | What the couple did that year                       |
| notes       | string \| null   | no       | Free-text notes                                     |
| pictures    | PictureInfo[]    | yes      | Array of uploaded picture metadata (empty by default) |
| location    | Location \| null | no       | Where this year's celebration took place            |
| updatedAt   | timestamp        | yes      | Last modification time                              |
| updatedBy   | string \| null   | no       | UID of last editor                                  |

### Embedded Types

#### Location

| Field | Type   | Required | Description              |
|-------|--------|----------|--------------------------|
| lat   | number | yes      | Latitude                 |
| lon   | number | yes      | Longitude                |
| name  | string | no       | Human-readable place name |

#### ContributorInfo

| Field       | Type      | Required | Description                    |
|-------------|-----------|----------|--------------------------------|
| uid         | string    | yes      | Firebase Auth UID              |
| displayName | string    | yes      | Display name (denormalized)    |
| email       | string    | yes      | Email address                  |
| addedAt     | timestamp | yes      | When contributor was added     |

#### PictureInfo

| Field      | Type      | Required | Description                          |
|------------|-----------|----------|--------------------------------------|
| url        | string    | yes      | Firebase Storage download URL        |
| filename   | string    | yes      | Original filename                    |
| storagePath| string    | yes      | Full path in Storage bucket          |
| uploadedAt | timestamp | yes      | Upload time                          |
| uploadedBy | string    | yes      | UID of uploader                      |

## Relationships

```
Anniversary (1) ──→ (N) AnniversaryYear
Anniversary (1) ──→ (N) ContributorInfo (embedded array)
AnniversaryYear (1) ──→ (N) PictureInfo (embedded array)
```

## Validation Rules

- `title`: 1-100 characters, trimmed
- `originalDate`: must not be more than 100 years in the past
- `yearNumber`: non-negative integer, unique within anniversary
- `pictures`: max 10 per yearly entry
- `contributorUids`: max 10 contributors per anniversary
- `activity`: max 500 characters
- `notes`: max 5000 characters
- Picture file size: max 10 MB per image (JPEG, PNG, WebP)

## State Transitions

### Anniversary Lifecycle

```
Created → Active → Deleted
```

- **Created**: Owner sets title + date. System auto-generates year placeholders.
- **Active**: Owner/contributors edit yearly entries, add pictures, manage contributors.
- **Deleted**: Owner confirms deletion. All years, pictures (Storage), and contributor references removed.

### Yearly Entry States

```
Placeholder → Populated
```

- **Placeholder**: Auto-generated with yearNumber and year only. All other fields empty/null.
- **Populated**: User has added at least one of: activity, notes, pictures, or location.

## Access Control

| Action                | Owner | Contributor | Other |
|-----------------------|-------|-------------|-------|
| Create anniversary    | yes   | no          | no    |
| Read anniversary      | yes   | yes         | no    |
| Edit anniversary meta | yes   | no          | no    |
| Delete anniversary    | yes   | no          | no    |
| Read yearly entries   | yes   | yes         | no    |
| Edit yearly entries   | yes   | yes         | no    |
| Upload pictures       | yes   | yes         | no    |
| Delete pictures       | yes   | yes (own)   | no    |
| Add contributor       | yes   | no          | no    |
| Remove contributor    | yes   | no          | no    |
| Search users          | yes   | no          | no    |

## Firebase Storage Structure

```
anniversaries/{anniversaryId}/years/{yearNumber}/{filename}
```

Pictures are stored per year per anniversary. Storage rules mirror Firestore access (owner or contributor can upload/delete).
