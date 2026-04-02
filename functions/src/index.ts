// Re-export all Cloud Function handlers
export { graphql } from './handlers/graphql.js';
export { aiChat, aiChatStream } from './handlers/aiChat.js';
export { cloudFiles } from './handlers/cloudFiles.js';
export { babyPhotos } from './handlers/babyPhotos.js';
export { resumeTailor } from './handlers/resumeTailor.js';
export { onResumeParseJobCreated } from './handlers/resumeParseWorker.js';
export { digitalLibrary } from './handlers/digitalLibrary.js';
export { onConversionJobCreated } from './handlers/conversionWorker.js';
export { onBatchConversionCreated } from './handlers/batchConversionWorker.js';
export { onZipJobCreated } from './handlers/zipWorker.js';
export { subscribeToAlerts, checkWeatherAlerts } from './handlers/weatherAlerts.js';
export { manageTopicSubscription, onAnnouncementCreated, buildAnnouncementMessage } from './handlers/notifications.js';

// Web Crawler — Firestore-triggered crawl worker
export { crawlWorker } from './handlers/webCrawler.js';

// Re-export shared utilities that were previously exported from index.ts
export { uploadToStorage, getStorageDownloadUrl } from './handlers/shared.js';
