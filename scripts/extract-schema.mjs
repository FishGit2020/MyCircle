#!/usr/bin/env node
/**
 * Extract the GraphQL schema from functions/src/schema.ts to a standalone .graphql file
 * for use with graphql-codegen.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// Gracefully skip if functions/ is not available (e.g., Docker build context)
if (!existsSync('functions/src/schema.ts')) {
  console.log('functions/src/schema.ts not found — skipping schema extraction (Docker build?)');
  process.exit(0);
}

const schemaTs = readFileSync('functions/src/schema.ts', 'utf-8');
// Extract the template literal content between backticks after `#graphql
const match = schemaTs.match(/`#graphql\r?\n([\s\S]*?)`/);
if (!match) {
  console.error('Could not extract schema from functions/src/schema.ts');
  process.exit(1);
}
// Add WeatherUpdate type and Subscription (defined in server schema, used by queries.ts)
const subscriptionAddendum = `
type WeatherUpdate {
  lat: Float!
  lon: Float!
  current: CurrentWeather!
  timestamp: String!
}

type Subscription {
  weatherUpdates(lat: Float!, lon: Float!): WeatherUpdate!
}
`;

let schema = match[1].trim();
// Extend the schema block to include subscription
schema = schema.replace(
  'schema {\n    query: Query\n    mutation: Mutation\n  }',
  'schema {\n    query: Query\n    mutation: Mutation\n    subscription: Subscription\n  }'
);
writeFileSync('schema.graphql', schema + '\n' + subscriptionAddendum);
console.log('Extracted schema.graphql');
