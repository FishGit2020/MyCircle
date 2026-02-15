import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { eventBus, MFEvents, WindowEvents, StorageKeys, subscribeToMFEvent } from './eventBus';

describe('eventBus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delivers published events to subscribers', () => {
    const callback = vi.fn();
    const unsub = eventBus.subscribe('test-event', callback);

    eventBus.publish('test-event', { foo: 'bar' });

    expect(callback).toHaveBeenCalledWith({ foo: 'bar' });
    unsub();
  });

  it('does not deliver events after unsubscribe', () => {
    const callback = vi.fn();
    const unsub = eventBus.subscribe('test-event-2', callback);

    unsub();
    eventBus.publish('test-event-2', { foo: 'bar' });

    expect(callback).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers for the same event', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const unsub1 = eventBus.subscribe('multi-event', cb1);
    const unsub2 = eventBus.subscribe('multi-event', cb2);

    eventBus.publish('multi-event', 'data');

    expect(cb1).toHaveBeenCalledWith('data');
    expect(cb2).toHaveBeenCalledWith('data');
    unsub1();
    unsub2();
  });

  it('catches errors in subscriber callbacks without breaking other subscribers', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cb1 = vi.fn(() => { throw new Error('test error'); });
    const cb2 = vi.fn();
    const unsub1 = eventBus.subscribe('error-event', cb1);
    const unsub2 = eventBus.subscribe('error-event', cb2);

    eventBus.publish('error-event', 'data');

    expect(cb1).toHaveBeenCalled();
    expect(cb2).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    unsub1();
    unsub2();
  });

  it('dispatches a CustomEvent on window when publishing', () => {
    const handler = vi.fn();
    window.addEventListener('custom-dom-event', handler);

    eventBus.publish('custom-dom-event', { detail: 123 });

    expect(handler).toHaveBeenCalled();
    const receivedEvent = handler.mock.calls[0][0] as CustomEvent;
    expect(receivedEvent.detail).toEqual({ detail: 123 });

    window.removeEventListener('custom-dom-event', handler);
  });

  it('publishes without data (undefined payload)', () => {
    const callback = vi.fn();
    const unsub = eventBus.subscribe('no-data-event', callback);

    eventBus.publish('no-data-event');

    expect(callback).toHaveBeenCalledWith(undefined);
    unsub();
  });
});

describe('subscribeToMFEvent', () => {
  it('receives CustomEvent detail when event is dispatched', () => {
    const callback = vi.fn();
    const unsub = subscribeToMFEvent('mf:test', callback);

    window.dispatchEvent(new CustomEvent('mf:test', { detail: { city: 'NYC' } }));

    expect(callback).toHaveBeenCalledWith({ city: 'NYC' });
    unsub();
  });

  it('stops receiving events after cleanup', () => {
    const callback = vi.fn();
    const unsub = subscribeToMFEvent('mf:test2', callback);

    unsub();
    window.dispatchEvent(new CustomEvent('mf:test2', { detail: 'data' }));

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('MFEvents constants', () => {
  it('has expected event keys', () => {
    expect(MFEvents.CITY_SELECTED).toBe('mf:city-selected');
    expect(MFEvents.WEATHER_LOADED).toBe('mf:weather-loaded');
    expect(MFEvents.NAVIGATION_REQUEST).toBe('mf:navigation-request');
    expect(MFEvents.THEME_CHANGED).toBe('mf:theme-changed');
    expect(MFEvents.PODCAST_PLAY_EPISODE).toBe('mf:podcast-play-episode');
    expect(MFEvents.PODCAST_CLOSE_PLAYER).toBe('mf:podcast-close-player');
    expect(MFEvents.PODCAST_QUEUE_EPISODE).toBe('mf:podcast-queue-episode');
  });
});

describe('WindowEvents constants', () => {
  it('has expected event keys', () => {
    expect(WindowEvents.UNITS_CHANGED).toBe('units-changed');
    expect(WindowEvents.WATCHLIST_CHANGED).toBe('watchlist-changed');
    expect(WindowEvents.NOTEBOOK_CHANGED).toBe('notebook-changed');
    expect(WindowEvents.BABY_DUE_DATE_CHANGED).toBe('baby-due-date-changed');
  });
});

describe('StorageKeys constants', () => {
  it('has expected storage keys', () => {
    expect(StorageKeys.TEMP_UNIT).toBe('tempUnit');
    expect(StorageKeys.SPEED_UNIT).toBe('speedUnit');
    expect(StorageKeys.THEME).toBe('theme');
    expect(StorageKeys.STOCK_WATCHLIST).toBe('stock-tracker-watchlist');
    expect(StorageKeys.BABY_DUE_DATE).toBe('baby-due-date');
    expect(StorageKeys.NOTEBOOK_CACHE).toBe('notebook-cache');
  });
});
