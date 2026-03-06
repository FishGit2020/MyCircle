import { describe, it, expect } from 'vitest';
import { buildAnnouncementMessage } from '../index';

describe('buildAnnouncementMessage', () => {
  it('builds message with title and description', () => {
    const msg = buildAnnouncementMessage({
      title: 'New Feature',
      description: 'Something cool',
      icon: 'feature',
    });
    expect(msg.topic).toBe('announcements');
    expect(msg.notification.title).toBe('New Feature');
    expect(msg.notification.body).toBe('Something cool');
    expect(msg.webpush.fcmOptions.link).toBe('/');
  });

  it('does NOT include imageUrl for category tags like "feature"', () => {
    const msg = buildAnnouncementMessage({ title: 'Test', icon: 'feature' });
    expect(msg.notification).not.toHaveProperty('imageUrl');
  });

  it('does NOT include imageUrl for "fix" category', () => {
    const msg = buildAnnouncementMessage({ title: 'Test', icon: 'fix' });
    expect(msg.notification).not.toHaveProperty('imageUrl');
  });

  it('does NOT include imageUrl for "improvement" category', () => {
    const msg = buildAnnouncementMessage({ title: 'Test', icon: 'improvement' });
    expect(msg.notification).not.toHaveProperty('imageUrl');
  });

  it('includes imageUrl when icon is a valid URL', () => {
    const msg = buildAnnouncementMessage({
      title: 'Test',
      icon: 'https://example.com/image.png',
    });
    expect(msg.notification.imageUrl).toBe('https://example.com/image.png');
  });

  it('handles missing fields with defaults', () => {
    const msg = buildAnnouncementMessage({});
    expect(msg.notification.title).toBe('New Announcement');
    expect(msg.notification.body).toBe('');
    expect(msg.notification).not.toHaveProperty('imageUrl');
  });

  it('handles missing icon gracefully', () => {
    const msg = buildAnnouncementMessage({ title: 'No Icon' });
    expect(msg.notification).not.toHaveProperty('imageUrl');
  });
});
