# GraphQL Schema Contract: Resume Tailor AI (015)

**Phase**: 1 — Design
**Date**: 2026-03-25
**File to extend**: `functions/src/schema.ts`

---

## New GraphQL Types

Add to `functions/src/schema.ts` after existing type definitions:

```graphql
# ─── Resume Tailor AI ─────────────────────────────────────────────────────────

type ResumeContact {
  name: String!
  email: String
  phone: String
  location: String
  linkedin: String
  github: String
  website: String
}

input ResumeContactInput {
  name: String!
  email: String
  phone: String
  location: String
  linkedin: String
  github: String
  website: String
}

type ResumeVersion {
  id: ID!
  title: String!
  bullets: [String!]!
}

input ResumeVersionInput {
  id: ID!
  title: String!
  bullets: [String!]!
}

type ResumeExperience {
  id: ID!
  company: String!
  location: String
  startDate: String!
  endDate: String!
  versions: [ResumeVersion!]!
}

input ResumeExperienceInput {
  id: ID!
  company: String!
  location: String
  startDate: String!
  endDate: String!
  versions: [ResumeVersionInput!]!
}

type ResumeEducation {
  id: ID!
  school: String!
  location: String
  degree: String!
  field: String!
  startDate: String
  endDate: String
  notes: [String!]!
}

input ResumeEducationInput {
  id: ID!
  school: String!
  location: String
  degree: String!
  field: String!
  startDate: String
  endDate: String
  notes: [String!]!
}

type ResumeProject {
  id: ID!
  name: String!
  startDate: String
  endDate: String
  bullets: [String!]!
}

input ResumeProjectInput {
  id: ID!
  name: String!
  startDate: String
  endDate: String
  bullets: [String!]!
}

type ResumeFactBank {
  contact: ResumeContact!
  experiences: [ResumeExperience!]!
  education: [ResumeEducation!]!
  skills: [String!]!
  projects: [ResumeProject!]!
  updatedAt: String!
}

input ResumeFactBankInput {
  contact: ResumeContactInput!
  experiences: [ResumeExperienceInput!]!
  education: [ResumeEducationInput!]!
  skills: [String!]!
  projects: [ResumeProjectInput!]!
}

type ResumeAtsScore {
  beforeScore: Float!
  score: Float!
  covered: [String!]!
  missing: [String!]!
  beforeCovered: [String!]!
  beforeMissing: [String!]!
  hardSkillsMissing: [String!]!
}

type ResumeKeywordReport {
  role: String
  company: String
  hardSkills: [String!]!
  titleKeywords: [String!]!
  actionKeywords: [String!]!
  businessContext: [String!]!
  domainKeywords: [String!]!
  hardFilters: [String!]!
  top10: [String!]!
  alreadyHave: [String!]!
  needToAdd: [String!]!
}

type GeneratedResumeResult {
  contact: ResumeContact!
  experiences: [ResumeExperience!]!
  education: [ResumeEducation!]!
  skills: [String!]!
  projects: [ResumeProject!]!
  atsScore: ResumeAtsScore!
  keywordReport: ResumeKeywordReport!
}

type ResumeApplication {
  id: ID!
  date: String!
  company: String!
  role: String!
  atsScoreBefore: Float!
  atsScoreAfter: Float!
  resumeSnapshot: String!
  jdText: String
}

input ResumeApplicationInput {
  company: String!
  role: String!
  atsScoreBefore: Float!
  atsScoreAfter: Float!
  resumeSnapshot: String!
  jdText: String
}
```

---

## New Queries

Add to `type Query` block:

```graphql
# Resume Tailor AI
resumeFactBank: ResumeFactBank
resumeApplications(limit: Int): [ResumeApplication!]!
scrapeJobUrl(url: String!): String
```

---

## New Mutations

Add to `type Mutation` block:

```graphql
# Resume Tailor AI
saveResumeFactBank(input: ResumeFactBankInput!): ResumeFactBank!
generateResume(jdText: String!): GeneratedResumeResult!
boostAtsScore(resumeJson: String!, jdText: String!): GeneratedResumeResult!
saveResumeApplication(input: ResumeApplicationInput!): ResumeApplication!
deleteResumeApplication(id: ID!): Boolean!
```

---

## New GraphQL Client Queries/Mutations

Add to `packages/shared/src/apollo/queries.ts`:

```typescript
// ─── Resume Tailor AI ────────────────────────────────────────────────────────

export const GET_RESUME_FACT_BANK = gql`
  query GetResumeFactBank {
    resumeFactBank {
      contact { name email phone location linkedin github website }
      experiences {
        id company location startDate endDate
        versions { id title bullets }
      }
      education { id school location degree field startDate endDate notes }
      skills
      projects { id name startDate endDate bullets }
      updatedAt
    }
  }
`;

export const GET_RESUME_APPLICATIONS = gql`
  query GetResumeApplications($limit: Int) {
    resumeApplications(limit: $limit) {
      id date company role atsScoreBefore atsScoreAfter resumeSnapshot jdText
    }
  }
`;

export const SCRAPE_JOB_URL = gql`
  query ScrapeJobUrl($url: String!) {
    scrapeJobUrl(url: $url)
  }
`;

export const SAVE_RESUME_FACT_BANK = gql`
  mutation SaveResumeFactBank($input: ResumeFactBankInput!) {
    saveResumeFactBank(input: $input) {
      updatedAt
    }
  }
`;

export const GENERATE_RESUME = gql`
  mutation GenerateResume($jdText: String!) {
    generateResume(jdText: $jdText) {
      contact { name email phone location linkedin github website }
      experiences {
        id company location startDate endDate
        versions { id title bullets }
      }
      education { id school location degree field startDate endDate notes }
      skills
      projects { id name startDate endDate bullets }
      atsScore {
        beforeScore score covered missing beforeCovered beforeMissing hardSkillsMissing
      }
      keywordReport {
        role company hardSkills titleKeywords actionKeywords businessContext
        domainKeywords hardFilters top10 alreadyHave needToAdd
      }
    }
  }
`;

export const BOOST_ATS_SCORE = gql`
  mutation BoostAtsScore($resumeJson: String!, $jdText: String!) {
    boostAtsScore(resumeJson: $resumeJson, jdText: $jdText) {
      contact { name email phone location linkedin github website }
      experiences {
        id company location startDate endDate
        versions { id title bullets }
      }
      education { id school location degree field startDate endDate notes }
      skills
      projects { id name startDate endDate bullets }
      atsScore {
        beforeScore score covered missing beforeCovered beforeMissing hardSkillsMissing
      }
      keywordReport {
        role company hardSkills titleKeywords actionKeywords businessContext
        domainKeywords hardFilters top10 alreadyHave needToAdd
      }
    }
  }
`;

export const SAVE_RESUME_APPLICATION = gql`
  mutation SaveResumeApplication($input: ResumeApplicationInput!) {
    saveResumeApplication(input: $input) {
      id date company role atsScoreBefore atsScoreAfter
    }
  }
`;

export const DELETE_RESUME_APPLICATION = gql`
  mutation DeleteResumeApplication($id: ID!) {
    deleteResumeApplication(id: $id)
  }
`;
```

---

## Resolver Location

New file: `functions/src/resolvers/resumeTailor.ts`

Exports:
- `createResumeTailorQueryResolvers(getOpenAiKey: () => string)` → `{ resumeFactBank, resumeApplications, scrapeJobUrl }`
- `createResumeTailorMutationResolvers(getOpenAiKey: () => string)` → `{ saveResumeFactBank, generateResume, boostAtsScore, saveResumeApplication, deleteResumeApplication }`

**Note**: After schema changes, run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`.

---

## Existing Schema Integration

The `createResolvers()` factory in `functions/src/resolvers/index.ts` must be extended:

```typescript
import { createResumeTailorQueryResolvers, createResumeTailorMutationResolvers } from './resumeTailor.js';

// In createResolvers() signature, add:
// getOpenAiKey: () => string

// In returned object:
Query: {
  ...createResumeTailorQueryResolvers(getOpenAiKey),
  // ... existing queries
},
Mutation: {
  ...createResumeTailorMutationResolvers(getOpenAiKey),
  // ... existing mutations
}
```

The `OPENAI_API_KEY` secret must be added to the `graphql` function's secrets array in `functions/src/handlers/graphql.ts`.
