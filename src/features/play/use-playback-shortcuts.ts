'use client';

import { type MutableRefObject,useEffect } from 'react';

import { type SearchResult } from '@/lib/types';

import { type PlaybackArtPlayer } from '@/features/play/player-core';

interface UsePlaybackShortcutsParams {
  artPlayerRef: MutableRefObject<PlaybackArtPlayer | null>;
  detailRef: MutableRefObject<SearchResult | null>;
  currentEpisodeIndexRef: MutableRefObject<number>;
  handlePreviousEpisode: () => void;
  handleNextEpisode: () => void;
}

export const usePlaybackShortcuts = ({
  artPlayerRef,
  detailRef,
  currentEpisodeIndexRef,
  handlePreviousEpisode,
  handleNextEpisode,
}: UsePlaybackShortcutsParams) => {
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.altKey && e.key === 'ArrowLeft') {
        if (detailRef.current && currentEpisodeIndexRef.current > 0) {
          handlePreviousEpisode();
          e.preventDefault();
        }
      }

      if (e.altKey && e.key === 'ArrowRight') {
        const d = detailRef.current;
        const idx = currentEpisodeIndexRef.current;
        if (d && idx < d.episodes.length - 1) {
          handleNextEpisode();
          e.preventDefault();
        }
      }

      if (!e.altKey && e.key === 'ArrowLeft') {
        if (artPlayerRef.current && artPlayerRef.current.currentTime > 5) {
          artPlayerRef.current.currentTime -= 10;
          e.preventDefault();
        }
      }

      if (!e.altKey && e.key === 'ArrowRight') {
        if (
          artPlayerRef.current &&
          artPlayerRef.current.currentTime < artPlayerRef.current.duration - 5
        ) {
          artPlayerRef.current.currentTime += 10;
          e.preventDefault();
        }
      }

      if (e.key === 'ArrowUp') {
        if (artPlayerRef.current && artPlayerRef.current.volume < 1) {
          artPlayerRef.current.volume =
            Math.round((artPlayerRef.current.volume + 0.1) * 10) / 10;
          artPlayerRef.current.notice.show = `音量: ${Math.round(
            artPlayerRef.current.volume * 100,
          )}`;
          e.preventDefault();
        }
      }

      if (e.key === 'ArrowDown') {
        if (artPlayerRef.current && artPlayerRef.current.volume > 0) {
          artPlayerRef.current.volume =
            Math.round((artPlayerRef.current.volume - 0.1) * 10) / 10;
          artPlayerRef.current.notice.show = `音量: ${Math.round(
            artPlayerRef.current.volume * 100,
          )}`;
          e.preventDefault();
        }
      }

      if (e.key === ' ') {
        if (artPlayerRef.current) {
          artPlayerRef.current.toggle();
          e.preventDefault();
        }
      }

      if (e.key === 'f' || e.key === 'F') {
        if (artPlayerRef.current) {
          artPlayerRef.current.fullscreen = !artPlayerRef.current.fullscreen;
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [
    artPlayerRef,
    currentEpisodeIndexRef,
    detailRef,
    handleNextEpisode,
    handlePreviousEpisode,
  ]);
};
