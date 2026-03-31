'use client';

import { type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

import { deletePlayRecord } from '@/lib/db.client';
import { type SearchResult } from '@/lib/types';

import { type WakeLockSentinel } from '@/features/play/player-core';
import {
  savePlaybackProgress,
  usePlaybackPersistence,
} from '@/features/play/playback-persistence';
import { resolveSourceChange } from '@/features/play/source-selection';
import { usePlaybackFavorite } from '@/features/play/use-playback-favorite';
import { usePlaybackShortcuts } from '@/features/play/use-playback-shortcuts';

interface UsePlaybackSessionParams {
  artPlayerRef: MutableRefObject<any>;
  currentSource: string;
  currentId: string;
  currentEpisodeIndex: number;
  searchTitle: string;
  availableSources: SearchResult[];
  currentSourceRef: MutableRefObject<string>;
  currentIdRef: MutableRefObject<string>;
  videoTitleRef: MutableRefObject<string>;
  detailRef: MutableRefObject<SearchResult | null>;
  currentEpisodeIndexRef: MutableRefObject<number>;
  resumeTimeRef: MutableRefObject<number | null>;
  wakeLockRef: MutableRefObject<WakeLockSentinel | null>;
  lastSaveTimeRef: MutableRefObject<number>;
  setError: Dispatch<SetStateAction<string | null>>;
  setIsVideoLoading: Dispatch<SetStateAction<boolean>>;
  setVideoLoadingStage: Dispatch<SetStateAction<'initing' | 'sourceChanging'>>;
  setVideoTitle: Dispatch<SetStateAction<string>>;
  setVideoYear: Dispatch<SetStateAction<string>>;
  setVideoCover: Dispatch<SetStateAction<string>>;
  setVideoDoubanId: Dispatch<SetStateAction<number>>;
  setCurrentSource: Dispatch<SetStateAction<string>>;
  setCurrentId: Dispatch<SetStateAction<string>>;
  setDetail: Dispatch<SetStateAction<SearchResult | null>>;
  setCurrentEpisodeIndex: Dispatch<SetStateAction<number>>;
}

export const usePlaybackSession = ({
  artPlayerRef,
  currentSource,
  currentId,
  currentEpisodeIndex,
  searchTitle,
  availableSources,
  currentSourceRef,
  currentIdRef,
  videoTitleRef,
  detailRef,
  currentEpisodeIndexRef,
  resumeTimeRef,
  wakeLockRef,
  lastSaveTimeRef,
  setError,
  setIsVideoLoading,
  setVideoLoadingStage,
  setVideoTitle,
  setVideoYear,
  setVideoCover,
  setVideoDoubanId,
  setCurrentSource,
  setCurrentId,
  setDetail,
  setCurrentEpisodeIndex,
}: UsePlaybackSessionParams) => {
  const saveCurrentPlayProgress = async () => {
    await savePlaybackProgress({
      artPlayerRef,
      currentSourceRef,
      currentIdRef,
      videoTitleRef,
      detailRef,
      currentEpisodeIndexRef,
      lastSaveTimeRef,
      searchTitle,
    });
  };

  const handleSourceChange = async (
    newSource: string,
    newId: string,
    newTitle: string,
  ) => {
    try {
      setVideoLoadingStage('sourceChanging');
      setIsVideoLoading(true);

      const currentPlayTime = artPlayerRef.current?.currentTime || 0;
      console.log('换源前当前播放时间:', currentPlayTime);

      if (currentSourceRef.current && currentIdRef.current) {
        try {
          await deletePlayRecord(
            currentSourceRef.current,
            currentIdRef.current,
          );
          console.log('已清除前一个播放记录');
        } catch (err) {
          console.error('清除播放记录失败:', err);
        }
      }

      const { detailData: newDetail, targetIndex, nextResumeTime } =
        resolveSourceChange({
          availableSources,
          newSource,
          newId,
          currentEpisodeIndex,
          currentPlayTime,
          currentResumeTime: resumeTimeRef.current,
        });
      resumeTimeRef.current = nextResumeTime;

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('source', newSource);
      newUrl.searchParams.set('id', newId);
      newUrl.searchParams.set('year', newDetail.year);
      window.history.replaceState({}, '', newUrl.toString());

      setVideoTitle(newDetail.title || newTitle);
      setVideoYear(newDetail.year);
      setVideoCover(newDetail.poster);
      setVideoDoubanId(newDetail.douban_id || 0);
      setCurrentSource(newSource);
      setCurrentId(newId);
      setDetail(newDetail);
      setCurrentEpisodeIndex(targetIndex);
    } catch (err) {
      setIsVideoLoading(false);
      setError(err instanceof Error ? err.message : '换源失败');
    }
  };

  const handleEpisodeChange = (episodeNumber: number, totalEpisodes: number) => {
    if (episodeNumber >= 0 && episodeNumber < totalEpisodes) {
      if (artPlayerRef.current && artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(episodeNumber);
    }
  };

  const handlePreviousEpisode = () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx > 0) {
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(idx - 1);
    }
  };

  const handleNextEpisode = () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx < d.episodes.length - 1) {
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(idx + 1);
    }
  };

  usePlaybackPersistence({
    artPlayerRef,
    currentSource,
    currentId,
    currentEpisodeIndex,
    resumeTimeRef,
    wakeLockRef,
    saveCurrentPlayProgress,
    setCurrentEpisodeIndex,
  });

  usePlaybackShortcuts({
    artPlayerRef,
    detailRef,
    currentEpisodeIndexRef,
    handlePreviousEpisode,
    handleNextEpisode,
  });

  const { favorited, handleToggleFavorite } = usePlaybackFavorite({
    currentSource,
    currentId,
    searchTitle,
    currentSourceRef,
    currentIdRef,
    videoTitleRef,
    detailRef,
  });

  return {
    favorited,
    handleToggleFavorite,
    handleSourceChange,
    handleEpisodeChange,
    handlePreviousEpisode,
    handleNextEpisode,
    saveCurrentPlayProgress,
  };
};
