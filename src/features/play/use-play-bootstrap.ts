'use client';

import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
} from 'react';

import { type SearchResult } from '@/lib/types';

import {
  type PlayLoadingStage,
  usePlayBootstrapState,
  type VideoLoadingStage,
} from '@/features/play/play-bootstrap-state';
import { type WakeLockSentinel } from '@/features/play/player-core';
import { resolveVideoUrl } from '@/features/play/source-selection';
import { type SourceVideoInfo } from '@/features/play/source-selection.types';
import { usePlayBootstrapInit } from '@/features/play/use-play-bootstrap-init';

interface UsePlayBootstrapParams {
  initialTitle: string;
  initialYear: string;
  initialSource: string;
  initialId: string;
  initialSearchTitle: string;
  initialSearchType: string;
  initialNeedPrefer: boolean;
}

interface UsePlayBootstrapResult {
  loading: boolean;
  loadingStage: PlayLoadingStage;
  loadingMessage: string;
  error: string | null;
  detail: SearchResult | null;
  videoTitle: string;
  videoYear: string;
  videoCover: string;
  videoDoubanId: number;
  currentSource: string;
  currentId: string;
  currentEpisodeIndex: number;
  videoUrl: string;
  totalEpisodes: number;
  availableSources: SearchResult[];
  sourceSearchLoading: boolean;
  sourceSearchError: string | null;
  precomputedVideoInfo: Map<string, SourceVideoInfo>;
  isEpisodeSelectorCollapsed: boolean;
  isVideoLoading: boolean;
  videoLoadingStage: VideoLoadingStage;
  currentSourceRef: MutableRefObject<string>;
  currentIdRef: MutableRefObject<string>;
  videoTitleRef: MutableRefObject<string>;
  detailRef: MutableRefObject<SearchResult | null>;
  currentEpisodeIndexRef: MutableRefObject<number>;
  resumeTimeRef: MutableRefObject<number | null>;
  lastVolumeRef: MutableRefObject<number>;
  lastPlaybackRateRef: MutableRefObject<number>;
  lastSaveTimeRef: MutableRefObject<number>;
  wakeLockRef: MutableRefObject<WakeLockSentinel | null>;
  setError: Dispatch<SetStateAction<string | null>>;
  setVideoTitle: Dispatch<SetStateAction<string>>;
  setVideoYear: Dispatch<SetStateAction<string>>;
  setVideoCover: Dispatch<SetStateAction<string>>;
  setVideoDoubanId: Dispatch<SetStateAction<number>>;
  setCurrentSource: Dispatch<SetStateAction<string>>;
  setCurrentId: Dispatch<SetStateAction<string>>;
  setDetail: Dispatch<SetStateAction<SearchResult | null>>;
  setCurrentEpisodeIndex: Dispatch<SetStateAction<number>>;
  setIsEpisodeSelectorCollapsed: Dispatch<SetStateAction<boolean>>;
  setIsVideoLoading: Dispatch<SetStateAction<boolean>>;
  setVideoLoadingStage: Dispatch<SetStateAction<'initing' | 'sourceChanging'>>;
}

export const usePlayBootstrap = ({
  initialTitle,
  initialYear,
  initialSource,
  initialId,
  initialSearchTitle,
  initialSearchType,
  initialNeedPrefer,
}: UsePlayBootstrapParams): UsePlayBootstrapResult => {
  const state = usePlayBootstrapState({
    initialTitle,
    initialYear,
    initialSource,
    initialId,
    initialNeedPrefer,
  });
  const { detail, currentEpisodeIndex, videoUrl, setVideoUrl } = state;

  useEffect(() => {
    const newUrl = resolveVideoUrl(detail, currentEpisodeIndex);
    if (newUrl !== videoUrl) {
      setVideoUrl(newUrl);
    }
  }, [currentEpisodeIndex, detail, setVideoUrl, videoUrl]);

  usePlayBootstrapInit({
    state,
    initialSearchTitle,
    initialSearchType,
  });

  return {
    loading: state.loading,
    loadingStage: state.loadingStage,
    loadingMessage: state.loadingMessage,
    error: state.error,
    detail: state.detail,
    videoTitle: state.videoTitle,
    videoYear: state.videoYear,
    videoCover: state.videoCover,
    videoDoubanId: state.videoDoubanId,
    currentSource: state.currentSource,
    currentId: state.currentId,
    currentEpisodeIndex: state.currentEpisodeIndex,
    videoUrl: state.videoUrl,
    totalEpisodes: state.totalEpisodes,
    availableSources: state.availableSources,
    sourceSearchLoading: state.sourceSearchLoading,
    sourceSearchError: state.sourceSearchError,
    precomputedVideoInfo: state.precomputedVideoInfo,
    isEpisodeSelectorCollapsed: state.isEpisodeSelectorCollapsed,
    isVideoLoading: state.isVideoLoading,
    videoLoadingStage: state.videoLoadingStage,
    currentSourceRef: state.currentSourceRef,
    currentIdRef: state.currentIdRef,
    videoTitleRef: state.videoTitleRef,
    detailRef: state.detailRef,
    currentEpisodeIndexRef: state.currentEpisodeIndexRef,
    resumeTimeRef: state.resumeTimeRef,
    lastVolumeRef: state.lastVolumeRef,
    lastPlaybackRateRef: state.lastPlaybackRateRef,
    lastSaveTimeRef: state.lastSaveTimeRef,
    wakeLockRef: state.wakeLockRef,
    setError: state.setError,
    setVideoTitle: state.setVideoTitle,
    setVideoYear: state.setVideoYear,
    setVideoCover: state.setVideoCover,
    setVideoDoubanId: state.setVideoDoubanId,
    setCurrentSource: state.setCurrentSource,
    setCurrentId: state.setCurrentId,
    setDetail: state.setDetail,
    setCurrentEpisodeIndex: state.setCurrentEpisodeIndex,
    setIsEpisodeSelectorCollapsed: state.setIsEpisodeSelectorCollapsed,
    setIsVideoLoading: state.setIsVideoLoading,
    setVideoLoadingStage: state.setVideoLoadingStage,
  };
};
