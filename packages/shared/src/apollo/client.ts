import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// Check if we're on the client side
const isBrowser = typeof window !== 'undefined';
const isProduction = isBrowser &&
  !window.location.hostname.includes('localhost') &&
  window.location.hostname !== '127.0.0.1' &&
  window.location.hostname !== '[::1]';

// Create Apollo Client factory function for micro frontends
export function createApolloClient(graphqlUrl?: string, wsUrl?: string) {
  // In production (Firebase), use relative URL which routes to Cloud Function
  // In development, use the local GraphQL server on port 3003
  const defaultGraphqlUrl = isBrowser
    ? isProduction
      ? '/graphql'
      : `http://${window.location.hostname}:3003/graphql`
    : 'http://localhost:3003/graphql';

  // WebSocket subscriptions are not supported in Firebase Cloud Functions
  // In production, we'll skip WebSocket connection
  const defaultWsUrl = isBrowser && !isProduction
    ? `ws://${window.location.hostname}:3003/graphql`
    : null;

  const httpLink = new HttpLink({
    uri: graphqlUrl || defaultGraphqlUrl
  });

  // Auth link: attaches Firebase ID token for authenticated endpoints (stock, podcast, AI)
  const authLink = new SetContextLink(async (prevContext) => {
    const idToken = await (window as any).__getFirebaseIdToken?.();
    return {
      headers: {
        ...prevContext.headers,
        ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
      },
    };
  });

  // App Check link: attaches Firebase App Check token for bot protection
  const appCheckLink = new SetContextLink(async (prevContext) => {
    const appCheckToken = await (window as any).__getAppCheckToken?.();
    return {
      headers: {
        ...prevContext.headers,
        ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {})
      }
    };
  });

  const httpWithAuth = ApolloLink.from([authLink, appCheckLink, httpLink]);

  let wsLink: GraphQLWsLink | null = null;

  // Only create WebSocket connection in development (not supported in Firebase)
  const finalWsUrl = wsUrl || defaultWsUrl;
  if (isBrowser && finalWsUrl) {
    const wsClient = createClient({
      url: finalWsUrl,
      connectionParams: () => ({}),
      on: {
        connected: () => console.log('WebSocket connected'),
        closed: () => console.log('WebSocket closed'),
        error: (error) => console.error('WebSocket error:', error)
      }
    });
    wsLink = new GraphQLWsLink(wsClient);
  }

  const splitLink = isBrowser && wsLink
    ? ApolloLink.split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink,
        httpWithAuth
      )
    : httpWithAuth;

  return new ApolloClient({
    connectToDevTools: true,
    link: splitLink,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            weather: { keyArgs: ['lat', 'lon'] },
            currentWeather: { keyArgs: ['lat', 'lon'] },
            forecast: { keyArgs: ['lat', 'lon'] },
            hourlyForecast: { keyArgs: ['lat', 'lon'] },
            stockQuote: { keyArgs: ['symbol'] },
            stockCandles: { keyArgs: ['symbol', 'from', 'to'] },
            searchStocks: { keyArgs: ['query'] },
            searchPodcasts: { keyArgs: ['query'] },
            podcastEpisodes: { keyArgs: ['feedId'] }
          }
        }
      }
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all'
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      }
    }
  });
}

// Default singleton client
let defaultClient: ApolloClient | null = null;

export function getApolloClient(): ApolloClient {
  if (!defaultClient) {
    defaultClient = createApolloClient();
  }
  return defaultClient;
}

export { ApolloClient, InMemoryCache };
