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
import { createLocationSearchQueryResolvers } from './locationSearch.js';
import { createInterviewSessionResolvers } from './interviewSessions.js';
import { createBabyInfoResolvers } from './babyInfo.js';
import { createNotesResolvers } from './notes.js';
import { createDailyLogResolvers } from './dailyLog.js';
import { createDealsResolvers } from './deals.js';

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
  const interviewSessionResolvers = createInterviewSessionResolvers();
  const babyInfoResolvers = createBabyInfoResolvers();
  const notesResolvers = createNotesResolvers();
  const dailyLogResolvers = createDailyLogResolvers();
  const dealsResolvers = createDealsResolvers();

  return {
    JSON: JSONScalar,

    Mutation: {
      ...createAiMutationResolvers(getApiKey, getFinnhubKey, getPodcastKeys, getYouVersionKey),
      ...worshipSongResolvers.Mutation,
      ...cloudFileResolvers.Mutation,
      ...babyPhotoResolvers.Mutation,
      ...digitalLibraryResolvers.Mutation,
      ...interviewSessionResolvers.Mutation,
      ...dailyLogResolvers.Mutation,
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
      ...createLocationSearchQueryResolvers(),
      ...interviewSessionResolvers.Query,
      ...babyInfoResolvers.Query,
      ...notesResolvers.Query,
      ...dealsResolvers.Query,
    },
  };
}
