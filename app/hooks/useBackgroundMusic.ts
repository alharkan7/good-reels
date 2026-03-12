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
  const interactionDone = useRef(false);

  // Initialize the specific local background music file
  useEffect(() => {
    // Only run in the browser
    if (typeof window !== 'undefined') {
      const audio = new Audio('/background_music.mp3');
      audio.volume = 0.5;
      
      const setRandomTime = () => {
         if (audio.duration && isFinite(audio.duration)) {
             audio.currentTime = Math.random() * audio.duration;
         }
      };

      audio.addEventListener('ended', () => {
         setRandomTime();
         audio.play().catch(e => console.warn("Ended jump blocked:", e));
      });

      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('error', (e) => console.error("Audio error:", e));

      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ""; // Clear memory safely
        audioRef.current = null;
      }
    };
  }, []);

  // Global Interaction unlocker
  useEffect(() => {
     const unlock = () => {
       if (!interactionDone.current && audioRef.current) {
         interactionDone.current = true;
         // We do NOT play/pause flip here anymore completely. It breaks Chrome strictly.
         // We just flag that interaction has occurred, so React effects know it's safe to manually call play() later.
         console.log("Interaction verified globally.");
       }
     };
     
     window.addEventListener('touchstart', unlock, { passive: true, once: true });
     window.addEventListener('click', unlock, { passive: true, once: true });
     window.addEventListener('scroll', unlock, { passive: true, once: true });
     
     return () => {
       window.removeEventListener('touchstart', unlock);
       window.removeEventListener('click', unlock);
       window.removeEventListener('scroll', unlock);
     }
  }, []);

  // Sync mute state securely and proactively start playing if allowed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      
      if (!isMuted && interactionDone.current) {
        audioRef.current
          .play()
          .catch((e) => {
             console.warn("Mute play blocked:", e);
             setIsPlaying(false);
          });
      } else if (isMuted) {
         audioRef.current.pause();
      }
    }
  }, [isMuted]);

  // Jump to random timestamp upon scrolling
  useEffect(() => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.duration && isFinite(audio.duration)) {
        audio.currentTime = Math.random() * audio.duration;
    } else {
        audio.addEventListener('loadedmetadata', () => {
           audio.currentTime = Math.random() * audio.duration;
        }, { once: true });
    }
    
    // Attempt play on reel change IF we aren't muted and interact has happened
    if (interactionDone.current && !audio.muted) {
        audio.play().catch(e => {
            console.warn("Scroll play blocked:", e);
            setIsPlaying(false);
        });
    }

  }, [currentIndex, tracks.length]);

  const tryPlay = useCallback(() => {
    console.log("tryPlay invoked manually");
    interactionDone.current = true;
    if (audioRef.current && !audioRef.current.muted) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
           console.warn("Manual play blocked:", e);
           setIsPlaying(false);
        });
    }
  }, []);

  return { isPlaying, tryPlay };
}
