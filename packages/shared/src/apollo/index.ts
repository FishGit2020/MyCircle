export { createApolloClient, getApolloClient, ApolloClient, InMemoryCache } from './client';
export * from './queries';

// Re-export Apollo React hooks so MFEs can import from @weather/shared
// instead of @apollo/client/react (which Module Federation doesn't share as a subpath)
export { useQuery, useLazyQuery, useMutation, useSubscription, ApolloProvider } from '@apollo/client/react';
