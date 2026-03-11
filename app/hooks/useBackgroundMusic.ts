'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '@/app/lib/types';

export function useBackgroundMusic(
  currentIndex: number,
  tracks: Track[],
  trackIndex: number,
  isMuted: boolean
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasInteracted = useRef(false);

  useEffect(() => {
    const handler = () => {
      hasInteracted.current = true;
    };
    window.addEventListener('touchstart', handler, { once: true });
    window.addEventListener('click', handler, { once: true });
    return () => {
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('click', handler);
    };
  }, []);

  useEffect(() => {
    if (tracks.length === 0) return;

    const actualIndex = trackIndex % tracks.length;
    const track = tracks[actualIndex];
    if (!track) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    const audio = audioRef.current;
    audio.src = track.audioUrl;
    audio.muted = isMuted;

    if (hasInteracted.current && !isMuted) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }

    return () => {
      audio.pause();
      setIsPlaying(false);
    };
  }, [currentIndex, trackIndex, tracks, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (!isMuted && hasInteracted.current) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    }
  }, [isMuted]);

  const tryPlay = useCallback(() => {
    hasInteracted.current = true;
    if (audioRef.current && !isMuted) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [isMuted]);

  return { isPlaying, tryPlay };
}
