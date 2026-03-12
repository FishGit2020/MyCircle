import { JSONScalar } from './shared.js';
import { createWeatherQueryResolvers } from './weather.js';
import { createStockQueryResolvers } from './stocks.js';
import { createCryptoQueryResolvers } from './crypto.js';
import { createPodcastQueryResolvers } from './podcasts.js';
import { createBibleQueryResolvers } from './bible.js';
import { createImmigrationQueryResolvers } from './immigration.js';
import { createAiMutationResolvers, createAiQueryResolvers } from './ai.js';
import { createWorshipSongResolvers } from './worshipSongs.js';
import { createCloudFileResolvers } from './cloudFiles.js';
import { createBabyPhotoResolvers } from './babyPhotos.js';
import { createDigitalLibraryResolvers } from './digitalLibrary.js';
import { createTransitQueryResolvers } from './transit.js';

// Resolver factory — identical signature and shape to the original resolvers.ts
export function createResolvers(
  getApiKey: () => string,
  getFinnhubKey?: () => string,
  getPodcastKeys?: () => { apiKey: string; apiSecret: string },
  getYouVersionKey?: () => string,
) {
  const worshipSongResolvers = createWorshipSongResolvers();
  const cloudFileResolvers = createCloudFileResolvers();
  const babyPhotoResolvers = createBabyPhotoResolvers();
  const digitalLibraryResolvers = createDigitalLibraryResolvers();

  return {
    JSON: JSONScalar,

    Mutation: {
      ...createAiMutationResolvers(getApiKey, getFinnhubKey, getPodcastKeys, getYouVersionKey),
      ...worshipSongResolvers.Mutation,
      ...cloudFileResolvers.Mutation,
      ...babyPhotoResolvers.Mutation,
      ...digitalLibraryResolvers.Mutation,
    },

    Query: {
      ...createAiQueryResolvers(),
      ...createWeatherQueryResolvers(getApiKey),
      ...createCryptoQueryResolvers(),
      ...createStockQueryResolvers(getFinnhubKey),
      ...createPodcastQueryResolvers(getPodcastKeys),
      ...createBibleQueryResolvers(getYouVersionKey),
      ...createImmigrationQueryResolvers(),
      ...worshipSongResolvers.Query,
      ...cloudFileResolvers.Query,
      ...babyPhotoResolvers.Query,
      ...digitalLibraryResolvers.Query,
      ...createTransitQueryResolvers(),
    },
  };
}
