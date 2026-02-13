import { useQuery } from '@apollo/client/react';
import { GET_CRYPTO_PRICES } from '../apollo/queries';
import type { CryptoPrice } from '../types/crypto';

interface CryptoPricesResponse {
  cryptoPrices: CryptoPrice[];
}

const DEFAULT_IDS = ['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin'];

export function useCryptoPrices(
  ids: string[] = DEFAULT_IDS,
  pollInterval: number = 60_000,
) {
  const { data, loading, error, refetch } = useQuery<CryptoPricesResponse>(GET_CRYPTO_PRICES, {
    variables: { ids },
    fetchPolicy: 'cache-and-network',
    pollInterval,
  });

  return {
    prices: data?.cryptoPrices ?? [],
    loading,
    error: error?.message ?? null,
    refetch: () => { refetch(); },
  };
}
