'use client';

import { type Dispatch, type MutableRefObject, type SetStateAction,useEffect } from 'react';

import {
  generateStorageKey,
  getAllPlayRecords,
  savePlayRecord,
} from '@/lib/db.client';
import { type SearchResult } from '@/lib/types';

import {
  type PlaybackArtPlayer,
  releaseWakeLock,
  requestWakeLock,
  type WakeLockSentinel,
} from '@/features/play/player-core';

interface SavePlaybackProgressParams {
  artPlayerRef: MutableRefObject<PlaybackArtPlayer | null>;
  currentSourceRef: MutableRefObject<string>;
  currentIdRef: MutableRefObject<string>;
  videoTitleRef: MutableRefObject<string>;
  detailRef: MutableRefObject<SearchResult | null>;
  currentEpisodeIndexRef: MutableRefObject<number>;
  lastSaveTimeRef: MutableRefObject<number>;
  searchTitle: string;
}

export const savePlaybackProgress = async ({
  artPlayerRef,
  currentSourceRef,
  currentIdRef,
  videoTitleRef,
  detailRef,
  currentEpisodeIndexRef,
  lastSaveTimeRef,
  searchTitle,
}: SavePlaybackProgressParams) => {
  if (
    !artPlayerRef.current ||
    !currentSourceRef.current ||
    !currentIdRef.current ||
    !videoTitleRef.current ||
    !detailRef.current?.source_name
  ) {
    return;
  }

  const player = artPlayerRef.current;
  const currentTime = player.currentTime || 0;
  const duration = player.duration || 0;

  if (currentTime < 1 || !duration) {
    return;
  }

  try {
    await savePlayRecord(currentSourceRef.current, currentIdRef.current, {
      title: videoTitleRef.current,
      source_name: detailRef.current?.source_name || '',
      year: detailRef.current?.year,
      cover: detailRef.current?.poster || '',
      index: currentEpisodeIndexRef.current + 1,
      total_episodes: detailRef.current?.episodes.length || 1,
      play_time: Math.floor(currentTime),
      total_time: Math.floor(duration),
      save_time: Date.now(),
      search_title: searchTitle,
    });

    lastSaveTimeRef.current = Date.now();
  } catch {
  }
};

interface UsePlaybackPersistenceParams {
  artPlayerRef: MutableRefObject<PlaybackArtPlayer | null>;
  currentSource: string;
  currentId: string;
  resumeTimeRef: MutableRefObject<number | null>;
  wakeLockRef: MutableRefObject<WakeLockSentinel | null>;
  saveCurrentPlayProgress: () => void | Promise<void>;
  setCurrentEpisodeIndex: Dispatch<SetStateAction<number>>;
}

export const usePlaybackPersistence = ({
  artPlayerRef,
  currentSource,
  currentId,
  resumeTimeRef,
  wakeLockRef,
  saveCurrentPlayProgress,
  setCurrentEpisodeIndex,
}: UsePlaybackPersistenceParams) => {
  useEffect(() => {
    const initFromHistory = async () => {
      if (!currentSource || !currentId) return;

      try {
        const allRecords = await getAllPlayRecords();
        const key = generateStorageKey(currentSource, currentId);
        const record = allRecords[key];

        if (!record) return;

        const targetIndex = record.index - 1;
        const targetTime = record.play_time;

        // Only restore once when the playback target changes; otherwise
        // a manual episode click would immediately get overwritten by history.
        setCurrentEpisodeIndex(targetIndex);

        resumeTimeRef.current = targetTime;
      } catch {
      }
    };

    initFromHistory();
  }, [currentId, currentSource, resumeTimeRef, setCurrentEpisodeIndex]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentPlayProgress();
      releaseWakeLock(wakeLockRef);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentPlayProgress();
        releaseWakeLock(wakeLockRef);
      } else if (document.visibilityState === 'visible') {
        if (artPlayerRef.current && !artPlayerRef.current.paused) {
          requestWakeLock(wakeLockRef);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [artPlayerRef, currentEpisodeIndex, saveCurrentPlayProgress, wakeLockRef]);
};
