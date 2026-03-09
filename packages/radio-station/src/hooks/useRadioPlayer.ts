import { useState, useRef, useCallback, useEffect } from 'react';
import type { RadioStation } from '../types';

export function useRadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.8;
      audioRef.current.addEventListener('error', () => {
        setIsPlaying(false);
      });
      audioRef.current.addEventListener('playing', () => {
        setIsPlaying(true);
      });
      audioRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
      });
    }
    return audioRef.current;
  }, []);

  const play = useCallback(
    (station: RadioStation) => {
      const audio = getAudio();
      const streamUrl = station.url_resolved || station.url;
      if (currentStation?.stationuuid === station.stationuuid && isPlaying) {
        audio.pause();
        return;
      }
      audio.src = streamUrl;
      audio.play().catch(() => {
        setIsPlaying(false);
      });
      setCurrentStation(station);
    },
    [getAudio, currentStation, isPlaying],
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    setCurrentStation(null);
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setVolumeState(clamped);
      const audio = audioRef.current;
      if (audio) {
        audio.volume = clamped;
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  return { play, stop, currentStation, isPlaying, volume, setVolume };
}
