import { useState, useEffect, useCallback } from 'react';
import { eventBus, MFEvents, subscribeToMFEvent, StorageKeys, WindowEvents } from '@mycircle/shared';
import type { AudioSource, AudioPlaybackStateEvent } from '@mycircle/shared';
import type { RadioStation } from '../types';
import { useRecentlyPlayed } from './useRecentlyPlayed';

/**
 * Radio player hook that delegates to the shell's GlobalAudioPlayer
 * via the shared event bus. No local Audio element is created.
 */
export function useRadioPlayer() {
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { addToRecent } = useRecentlyPlayed();

  // Listen to playback state from GlobalAudioPlayer
  useEffect(() => {
    const unsub = subscribeToMFEvent<AudioPlaybackStateEvent>(
      MFEvents.AUDIO_PLAYBACK_STATE,
      (data) => {
        if (data.type === 'radio') {
          setIsPlaying(data.isPlaying);
        } else {
          // Another source took over — radio is no longer playing
          if (isPlaying) setIsPlaying(false);
        }
      },
    );
    return unsub;
  }, [isPlaying]);

  const play = useCallback((station: RadioStation) => {
    // If same station is playing, toggle pause
    if (currentStation?.stationuuid === station.stationuuid && isPlaying) {
      eventBus.publish(MFEvents.AUDIO_TOGGLE_PLAY);
      return;
    }

    const source: AudioSource = {
      type: 'radio',
      track: {
        id: station.stationuuid,
        url: station.url_resolved || station.url,
        title: station.name,
      },
      collection: {
        id: station.stationuuid,
        title: station.name,
        artwork: station.favicon || undefined,
        tracks: [{
          id: station.stationuuid,
          url: station.url_resolved || station.url,
          title: station.name,
        }],
      },
      trackIndex: 0,
      navigateTo: '/radio',
      progressKey: StorageKeys.RADIO_FAVORITES, // radio is live, no real progress
      nowPlayingKey: StorageKeys.RADIO_FAVORITES,
      lastPlayedKey: StorageKeys.RADIO_FAVORITES,
      lastPlayedEvent: WindowEvents.RADIO_CHANGED,
      canQueue: false,
    };

    eventBus.publish(MFEvents.AUDIO_PLAY, source);
    addToRecent(station);
    setCurrentStation(station);
  }, [currentStation, isPlaying, addToRecent]);

  const stop = useCallback(() => {
    eventBus.publish(MFEvents.AUDIO_CLOSE);
    setCurrentStation(null);
    setIsPlaying(false);
  }, []);

  return { play, stop, currentStation, isPlaying };
}
