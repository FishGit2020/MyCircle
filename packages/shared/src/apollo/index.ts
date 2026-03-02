export { createApolloClient, getApolloClient, ApolloClient, InMemoryCache } from './client';
export * from './queries';
// Generated GraphQL operation types available via direct import:
//   import type { GetWeatherQuery } from '@mycircle/shared/apollo/generated'
// Not re-exported from barrel to avoid TS union type expansion issues.

// Re-export Apollo React hooks so MFEs can import from @mycircle/shared
// instead of @apollo/client/react (which Module Federation doesn't share as a subpath)
export { useQuery, useLazyQuery, useMutation, useSubscription, ApolloProvider } from '@apollo/client/react';
