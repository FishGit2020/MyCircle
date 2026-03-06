import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getMessaging } from 'firebase-admin/messaging';

const VALID_TOPICS = ['announcements'];

/**
 * Callable function: subscribe/unsubscribe an FCM token to/from a messaging topic.
 * Payload: { token: string, topic: string, subscribe: boolean }
 */
export const manageTopicSubscription = onCall(
  { maxInstances: 5, enforceAppCheck: true },
  async (request) => {
    const { token, topic, subscribe } = request.data as {
      token: string;
      topic: string;
      subscribe: boolean;
    };

    if (!token || typeof token !== 'string') {
      throw new HttpsError('invalid-argument', 'FCM token is required');
    }
    if (!topic || !VALID_TOPICS.includes(topic)) {
      throw new HttpsError('invalid-argument', `Invalid topic. Allowed: ${VALID_TOPICS.join(', ')}`);
    }

    const messaging = getMessaging();

    if (subscribe) {
      await messaging.subscribeToTopic(token, topic);
      logger.info('Subscribed token to topic', { topic, tokenPrefix: token.slice(0, 10) });
    } else {
      await messaging.unsubscribeFromTopic(token, topic);
      logger.info('Unsubscribed token from topic', { topic, tokenPrefix: token.slice(0, 10) });
    }

    return { success: true, subscribed: subscribe };
  }
);

/** Build the FCM message payload for an announcement. Exported for testing. */
export function buildAnnouncementMessage(data: Record<string, unknown>) {
  const title = (data.title as string) || 'New Announcement';
  const body = (data.description as string) || '';
  // icon field stores category tags ('feature','fix','improvement'), not URLs.
  // Only use imageUrl if the field looks like a URL.
  const rawIcon = (data.icon as string) || '';
  const imageUrl = rawIcon.startsWith('http') ? rawIcon : undefined;

  return {
    topic: 'announcements' as const,
    notification: { title, body, ...(imageUrl ? { imageUrl } : {}) },
    webpush: { fcmOptions: { link: '/' } },
  };
}

/**
 * Firestore trigger: sends a push notification to the 'announcements' topic
 * whenever a new announcement document is created.
 */
export const onAnnouncementCreated = onDocumentCreated(
  'announcements/{announcementId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) {
      logger.warn('onAnnouncementCreated fired with no data');
      return;
    }

    const messaging = getMessaging();

    try {
      await messaging.send(buildAnnouncementMessage(data));
      logger.info('Sent announcement push notification', { title: data.title });
    } catch (err: any) {
      logger.error('Failed to send announcement notification', { error: err.message });
    }
  }
);
