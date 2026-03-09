// Re-export all Cloud Function handlers
export { graphql } from './handlers/graphql.js';
export { aiChat, aiChatStream } from './handlers/aiChat.js';
export { stockProxy } from './handlers/stockProxy.js';
export { podcastProxy } from './handlers/podcastProxy.js';
export { cloudFiles } from './handlers/cloudFiles.js';
export { babyPhotos } from './handlers/babyPhotos.js';
export { digitalLibrary } from './handlers/digitalLibrary.js';
export { subscribeToAlerts, checkWeatherAlerts } from './handlers/weatherAlerts.js';
export { worshipSongsApi, syncWorshipSongsToStorage } from './handlers/worshipSongs.js';
export { manageTopicSubscription, onAnnouncementCreated, buildAnnouncementMessage } from './handlers/notifications.js';

// Re-export shared utilities that were previously exported from index.ts
export { uploadToStorage, getStorageDownloadUrl } from './handlers/shared.js';
