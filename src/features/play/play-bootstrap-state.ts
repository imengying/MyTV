'use client';

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';

import { type SearchResult } from '@/lib/types';

import { type WakeLockSentinel } from '@/features/play/player-core';
import { type SourceVideoInfo } from '@/features/play/source-selection.types';

export type PlayLoadingStage =
  | 'searching'
  | 'preferring'
  | 'fetching'
  | 'ready';
export type VideoLoadingStage = 'initing' | 'sourceChanging';

interface UsePlayBootstrapStateParams {
  initialTitle: string;
  initialYear: string;
  initialSource: string;
  initialId: string;
  initialNeedPrefer: boolean;
}

const getOptimizationPreference = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('enableOptimization');
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        /* ignore */
      }
    }
  }
  return true;
};

export interface PlayBootstrapState {
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
  needPrefer: boolean;
  currentEpisodeIndex: number;
  videoUrl: string;
  totalEpisodes: number;
  availableSources: SearchResult[];
  sourceSearchLoading: boolean;
  sourceSearchError: string | null;
  optimizationEnabled: boolean;
  precomputedVideoInfo: Map<string, SourceVideoInfo>;
  isEpisodeSelectorCollapsed: boolean;
  isVideoLoading: boolean;
  videoLoadingStage: VideoLoadingStage;
  needPreferRef: MutableRefObject<boolean>;
  currentSourceRef: MutableRefObject<string>;
  currentIdRef: MutableRefObject<string>;
  videoTitleRef: MutableRefObject<string>;
  videoYearRef: MutableRefObject<string>;
  detailRef: MutableRefObject<SearchResult | null>;
  currentEpisodeIndexRef: MutableRefObject<number>;
  resumeTimeRef: MutableRefObject<number | null>;
  lastVolumeRef: MutableRefObject<number>;
  lastPlaybackRateRef: MutableRefObject<number>;
  lastSaveTimeRef: MutableRefObject<number>;
  wakeLockRef: MutableRefObject<WakeLockSentinel | null>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setLoadingStage: Dispatch<SetStateAction<PlayLoadingStage>>;
  setLoadingMessage: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setVideoTitle: Dispatch<SetStateAction<string>>;
  setVideoYear: Dispatch<SetStateAction<string>>;
  setVideoCover: Dispatch<SetStateAction<string>>;
  setVideoDoubanId: Dispatch<SetStateAction<number>>;
  setCurrentSource: Dispatch<SetStateAction<string>>;
  setCurrentId: Dispatch<SetStateAction<string>>;
  setDetail: Dispatch<SetStateAction<SearchResult | null>>;
  setNeedPrefer: Dispatch<SetStateAction<boolean>>;
  setCurrentEpisodeIndex: Dispatch<SetStateAction<number>>;
  setVideoUrl: Dispatch<SetStateAction<string>>;
  setAvailableSources: Dispatch<SetStateAction<SearchResult[]>>;
  setSourceSearchLoading: Dispatch<SetStateAction<boolean>>;
  setSourceSearchError: Dispatch<SetStateAction<string | null>>;
  setPrecomputedVideoInfo: Dispatch<
    SetStateAction<Map<string, SourceVideoInfo>>
  >;
  setIsEpisodeSelectorCollapsed: Dispatch<SetStateAction<boolean>>;
  setIsVideoLoading: Dispatch<SetStateAction<boolean>>;
  setVideoLoadingStage: Dispatch<SetStateAction<VideoLoadingStage>>;
}

export const usePlayBootstrapState = ({
  initialTitle,
  initialYear,
  initialSource,
  initialId,
  initialNeedPrefer,
}: UsePlayBootstrapStateParams): PlayBootstrapState => {
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] =
    useState<PlayLoadingStage>('searching');
  const [loadingMessage, setLoadingMessage] =
    useState('正在搜索播放源...');
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SearchResult | null>(null);

  const [videoTitle, setVideoTitle] = useState(initialTitle);
  const [videoYear, setVideoYear] = useState(initialYear);
  const [videoCover, setVideoCover] = useState('');
  const [videoDoubanId, setVideoDoubanId] = useState(0);
  const [currentSource, setCurrentSource] = useState(initialSource);
  const [currentId, setCurrentId] = useState(initialId);
  const [needPrefer, setNeedPrefer] = useState(initialNeedPrefer);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [availableSources, setAvailableSources] = useState<SearchResult[]>([]);
  const [sourceSearchLoading, setSourceSearchLoading] = useState(false);
  const [sourceSearchError, setSourceSearchError] = useState<string | null>(
    null,
  );
  const [optimizationEnabled] = useState<boolean>(getOptimizationPreference);
  const [precomputedVideoInfo, setPrecomputedVideoInfo] = useState<
    Map<string, SourceVideoInfo>
  >(new Map());
  const [isEpisodeSelectorCollapsed, setIsEpisodeSelectorCollapsed] =
    useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoLoadingStage, setVideoLoadingStage] =
    useState<VideoLoadingStage>('initing');

  const needPreferRef = useRef(needPrefer);
  const currentSourceRef = useRef(currentSource);
  const currentIdRef = useRef(currentId);
  const videoTitleRef = useRef(videoTitle);
  const videoYearRef = useRef(videoYear);
  const detailRef = useRef<SearchResult | null>(detail);
  const currentEpisodeIndexRef = useRef(currentEpisodeIndex);
  const resumeTimeRef = useRef<number | null>(null);
  const lastVolumeRef = useRef<number>(0.7);
  const lastPlaybackRateRef = useRef<number>(1.0);
  const lastSaveTimeRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    needPreferRef.current = needPrefer;
  }, [needPrefer]);

  useEffect(() => {
    currentSourceRef.current = currentSource;
    currentIdRef.current = currentId;
    detailRef.current = detail;
    currentEpisodeIndexRef.current = currentEpisodeIndex;
    videoTitleRef.current = videoTitle;
    videoYearRef.current = videoYear;
  }, [
    currentSource,
    currentId,
    detail,
    currentEpisodeIndex,
    videoTitle,
    videoYear,
  ]);

  return {
    loading,
    loadingStage,
    loadingMessage,
    error,
    detail,
    videoTitle,
    videoYear,
    videoCover,
    videoDoubanId,
    currentSource,
    currentId,
    needPrefer,
    currentEpisodeIndex,
    videoUrl,
    totalEpisodes: detail?.episodes?.length || 0,
    availableSources,
    sourceSearchLoading,
    sourceSearchError,
    optimizationEnabled,
    precomputedVideoInfo,
    isEpisodeSelectorCollapsed,
    isVideoLoading,
    videoLoadingStage,
    needPreferRef,
    currentSourceRef,
    currentIdRef,
    videoTitleRef,
    videoYearRef,
    detailRef,
    currentEpisodeIndexRef,
    resumeTimeRef,
    lastVolumeRef,
    lastPlaybackRateRef,
    lastSaveTimeRef,
    wakeLockRef,
    setLoading,
    setLoadingStage,
    setLoadingMessage,
    setError,
    setVideoTitle,
    setVideoYear,
    setVideoCover,
    setVideoDoubanId,
    setCurrentSource,
    setCurrentId,
    setDetail,
    setNeedPrefer,
    setCurrentEpisodeIndex,
    setVideoUrl,
    setAvailableSources,
    setSourceSearchLoading,
    setSourceSearchError,
    setPrecomputedVideoInfo,
    setIsEpisodeSelectorCollapsed,
    setIsVideoLoading,
    setVideoLoadingStage,
  };
};
