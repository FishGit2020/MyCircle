import { JSONScalar } from './shared.js';
import { createWeatherQueryResolvers } from './weather.js';
import { createStockQueryResolvers } from './stocks.js';
import { createCryptoQueryResolvers } from './crypto.js';
import { createPodcastQueryResolvers } from './podcasts.js';
import { createBibleQueryResolvers } from './bible.js';
import { createImmigrationQueryResolvers } from './immigration.js';
import { createAiMutationResolvers, createAiQueryResolvers } from './ai.js';
import { createWorshipSongResolvers } from './worshipSongs.js';
import { createWorshipSetlistResolvers } from './worshipSetlists.js';
import { createCloudFileResolvers } from './cloudFiles.js';
import { createCloudFilesEnhancementResolvers } from './cloudFilesEnhancements.js';
import { createBabyPhotoResolvers } from './babyPhotos.js';
import { createDigitalLibraryResolvers } from './digitalLibrary.js';
import { createTransitQueryResolvers } from './transit.js';
import { createLocationSearchQueryResolvers } from './locationSearch.js';
import { createInterviewSessionResolvers } from './interviewSessions.js';
import { createBabyInfoResolvers } from './babyInfo.js';
import { createNotesResolvers } from './notes.js';
import { createDailyLogResolvers } from './dailyLog.js';
import { createDealsResolvers } from './deals.js';
import { createWebCrawlerResolvers } from './webCrawler.js';
import { createRadioStationResolvers } from './radioStations.js';
import { createRoutingResolvers } from './routing.js';
import { createResumeTailorQueryResolvers, createResumeTailorMutationResolvers } from './resumeTailor.js';
import { createSqlQueryResolvers, createSqlMutationResolvers } from './sql.js';

// Resolver factory — identical signature and shape to the original resolvers.ts
export function createResolvers(
  getApiKey: () => string,
  getFinnhubKey?: () => string,
  getPodcastKeys?: () => { apiKey: string; apiSecret: string },
  getYouVersionKey?: () => string,
) {
  const worshipSongResolvers = createWorshipSongResolvers();
  const worshipSetlistResolvers = createWorshipSetlistResolvers();
  const cloudFileResolvers = createCloudFileResolvers();
  const cloudFilesEnhancementResolvers = createCloudFilesEnhancementResolvers();
  const babyPhotoResolvers = createBabyPhotoResolvers();
  const digitalLibraryResolvers = createDigitalLibraryResolvers();
  const interviewSessionResolvers = createInterviewSessionResolvers();
  const babyInfoResolvers = createBabyInfoResolvers();
  const notesResolvers = createNotesResolvers();
  const dailyLogResolvers = createDailyLogResolvers();
  const dealsResolvers = createDealsResolvers();
  const webCrawlerResolvers = createWebCrawlerResolvers();

  return {
    JSON: JSONScalar,

    Mutation: {
      ...createAiMutationResolvers(getApiKey, getFinnhubKey, getPodcastKeys, getYouVersionKey),
      ...worshipSongResolvers.Mutation,
      ...worshipSetlistResolvers.Mutation,
      ...cloudFileResolvers.Mutation,
      ...cloudFilesEnhancementResolvers.Mutation,
      ...babyPhotoResolvers.Mutation,
      ...digitalLibraryResolvers.Mutation,
      ...interviewSessionResolvers.Mutation,
      ...dailyLogResolvers.Mutation,
      ...webCrawlerResolvers.Mutation,
      ...notesResolvers.Mutation,
      ...createResumeTailorMutationResolvers(),
      ...createSqlMutationResolvers(),
      ...createRadioStationResolvers().Mutation,
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
      ...worshipSetlistResolvers.Query,
      ...cloudFileResolvers.Query,
      ...cloudFilesEnhancementResolvers.Query,
      ...babyPhotoResolvers.Query,
      ...digitalLibraryResolvers.Query,
      ...createTransitQueryResolvers(),
      ...createLocationSearchQueryResolvers(),
      ...interviewSessionResolvers.Query,
      ...babyInfoResolvers.Query,
      ...notesResolvers.Query,
      ...dealsResolvers.Query,
      ...webCrawlerResolvers.Query,
      ...createRadioStationResolvers().Query,
      ...createRoutingResolvers().Query,
      ...createResumeTailorQueryResolvers(),
      ...createSqlQueryResolvers(),
    },
  };
}
