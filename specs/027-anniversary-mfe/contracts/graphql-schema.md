# GraphQL Schema Contract: Anniversary Tracker

**Branch**: `027-anniversary-mfe` | **Date**: 2026-04-09

## Types

```graphql
type Anniversary {
  id: ID!
  ownerUid: String!
  ownerDisplayName: String!
  title: String!
  originalDate: String!
  location: Location
  contributorUids: [String!]!
  contributors: [ContributorInfo!]!
  years: [AnniversaryYear!]!
  createdAt: String!
  updatedAt: String!
}

type AnniversaryYear {
  yearNumber: Int!
  year: Int!
  activity: String
  notes: String
  pictures: [PictureInfo!]!
  location: Location
  updatedAt: String
  updatedBy: String
}

type Location {
  lat: Float!
  lon: Float!
  name: String
}

type ContributorInfo {
  uid: String!
  displayName: String!
  email: String!
  addedAt: String!
}

type PictureInfo {
  url: String!
  filename: String!
  storagePath: String!
  uploadedAt: String!
  uploadedBy: String!
}

type UserSearchResult {
  uid: String!
  displayName: String
  email: String!
}
```

## Input Types

```graphql
input CreateAnniversaryInput {
  title: String!
  originalDate: String!
  location: LocationInput
}

input UpdateAnniversaryInput {
  title: String
  location: LocationInput
}

input LocationInput {
  lat: Float!
  lon: Float!
  name: String
}

input UpdateAnniversaryYearInput {
  activity: String
  notes: String
  location: LocationInput
}

input AnniversaryPictureInput {
  anniversaryId: ID!
  yearNumber: Int!
  filename: String!
  base64Data: String!
  mimeType: String!
}
```

## Queries

```graphql
type Query {
  # Fetch all anniversaries for the current user (owned + shared)
  anniversaries: [Anniversary!]!

  # Fetch a single anniversary with all yearly entries
  anniversary(id: ID!): Anniversary

  # Fetch a single yearly entry
  anniversaryYear(anniversaryId: ID!, yearNumber: Int!): AnniversaryYear

  # Search users by email for contributor management
  searchUsers(query: String!): [UserSearchResult!]!
}
```

## Mutations

```graphql
type Mutation {
  # Create a new anniversary (auto-generates yearly placeholders)
  createAnniversary(input: CreateAnniversaryInput!): Anniversary!

  # Update anniversary metadata (title, location) — owner only
  updateAnniversary(id: ID!, input: UpdateAnniversaryInput!): Anniversary!

  # Delete an anniversary and all related data — owner only
  deleteAnniversary(id: ID!): Boolean!

  # Update a yearly entry (activity, notes, location)
  updateAnniversaryYear(
    anniversaryId: ID!
    yearNumber: Int!
    input: UpdateAnniversaryYearInput!
  ): AnniversaryYear!

  # Upload a picture to a yearly entry
  uploadAnniversaryPicture(input: AnniversaryPictureInput!): PictureInfo!

  # Delete a picture from a yearly entry
  deleteAnniversaryPicture(
    anniversaryId: ID!
    yearNumber: Int!
    storagePath: String!
  ): Boolean!

  # Add a contributor by UID — owner only
  addAnniversaryContributor(anniversaryId: ID!, contributorUid: String!): Anniversary!

  # Remove a contributor — owner only
  removeAnniversaryContributor(anniversaryId: ID!, contributorUid: String!): Anniversary!
}
```

## Query Behavior Notes

- `anniversaries` returns all anniversaries where the requesting user is either the owner or in `contributorUids`.
- `anniversary(id)` returns null if the user is neither owner nor contributor.
- `searchUsers(query)` searches by email prefix match using Firebase Admin SDK. Returns max 10 results. Excludes the requesting user.
- `createAnniversary` auto-generates `AnniversaryYear` documents from year 0 through the current year.
- `deleteAnniversary` cascades: deletes all yearly entries, all pictures from Storage, and removes all contributor references.
- Picture upload validates file size (max 10 MB) and MIME type (image/jpeg, image/png, image/webp) server-side.
