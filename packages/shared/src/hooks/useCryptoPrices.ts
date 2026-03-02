import { useQuery } from '@apollo/client/react';
import { GET_CRYPTO_PRICES } from '../apollo/queries';
import type { GetCryptoPricesQuery } from '../apollo/generated';

const DEFAULT_IDS = ['bitcoin'];

export function useCryptoPrices(ids: string[] = DEFAULT_IDS) {
  const { data, loading, error, refetch } = useQuery<GetCryptoPricesQuery>(GET_CRYPTO_PRICES, {
    variables: { ids },
    fetchPolicy: 'cache-and-network',
  });

  return {
    prices: data?.cryptoPrices ?? [],
    loading,
    error: error?.message ?? null,
    refetch: () => { refetch(); },
  };
}
