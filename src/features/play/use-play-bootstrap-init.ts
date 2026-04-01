'use client';

import { useEffect, useRef } from 'react';

import { type PlayBootstrapState } from '@/features/play/play-bootstrap-state';
import { resolveInitialPlaybackSession } from '@/features/play/source-selection';

interface UsePlayBootstrapInitParams {
  state: PlayBootstrapState;
  initialSearchTitle: string;
  initialSearchType: string;
}

const syncPlaybackSearchParams = ({
  source,
  id,
  year,
  title,
}: {
  source: string;
  id: string;
  year: string;
  title: string;
}) => {
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('source', source);
  newUrl.searchParams.set('id', id);
  newUrl.searchParams.set('year', year);
  newUrl.searchParams.set('title', title);
  newUrl.searchParams.delete('prefer');
  window.history.replaceState({}, '', newUrl.toString());
};

export const usePlayBootstrapInit = ({
  state,
  initialSearchTitle,
  initialSearchType,
}: UsePlayBootstrapInitParams) => {
  const stateRef = useRef(state);
  const initialSearchTitleRef = useRef(initialSearchTitle);
  const initialSearchTypeRef = useRef(initialSearchType);

  // This bootstrap flow should run once on first mount.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const initAll = async () => {
      const state = stateRef.current;
      const {
        currentSource,
        currentId,
        videoTitle,
        currentEpisodeIndex,
        needPreferRef,
        optimizationEnabled,
        videoTitleRef,
        videoYearRef,
        setError,
        setLoading,
        setLoadingStage,
        setLoadingMessage,
        setSourceSearchLoading,
        setSourceSearchError,
        setAvailableSources,
        setPrecomputedVideoInfo,
        setNeedPrefer,
        setCurrentSource,
        setCurrentId,
        setVideoYear,
        setVideoTitle,
        setVideoCover,
        setVideoDoubanId,
        setDetail,
        setCurrentEpisodeIndex,
      } = state;

      if (
        !currentSource &&
        !currentId &&
        !videoTitle &&
        !initialSearchTitleRef.current
      ) {
        setError('缺少必要参数');
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadingStage(currentSource && currentId ? 'fetching' : 'searching');
      setLoadingMessage(
        currentSource && currentId
          ? '🎬 正在获取视频详情...'
          : '🔍 正在搜索播放源...',
      );
      setSourceSearchLoading(true);
      setSourceSearchError(null);

      const shouldPrefer =
        (!currentSource || !currentId || needPreferRef.current) &&
        optimizationEnabled;
      if (shouldPrefer) {
        setLoadingStage('preferring');
        setLoadingMessage('⚡ 正在优选最佳播放源...');
      }

      let session;
      try {
        session = await resolveInitialPlaybackSession({
          currentSource,
          currentId,
          videoTitle,
          searchTitle: initialSearchTitleRef.current,
          searchType: initialSearchTypeRef.current,
          needPrefer: needPreferRef.current,
          optimizationEnabled,
          currentTitle: videoTitleRef.current,
          currentYear: videoYearRef.current,
        });
      } catch {
        if (cancelled) return;
        setError('未找到匹配结果');
        setLoading(false);
        setSourceSearchLoading(false);
        return;
      }

      if (cancelled) return;

      const {
        availableSources,
        detailData,
        precomputedVideoInfo,
        sourceSearchError,
      } = session;

      setAvailableSources(availableSources);
      setSourceSearchError(sourceSearchError);
      setPrecomputedVideoInfo(precomputedVideoInfo);
      setSourceSearchLoading(false);

      setNeedPrefer(false);
      setCurrentSource(detailData.source);
      setCurrentId(detailData.id);
      setVideoYear(detailData.year);
      setVideoTitle(detailData.title || videoTitleRef.current);
      setVideoCover(detailData.poster);
      setVideoDoubanId(detailData.douban_id || 0);
      setDetail(detailData);
      if (currentEpisodeIndex >= detailData.episodes.length) {
        setCurrentEpisodeIndex(0);
      }

      syncPlaybackSearchParams({
        source: detailData.source,
        id: detailData.id,
        year: detailData.year,
        title: detailData.title,
      });

      setLoadingStage('ready');
      setLoadingMessage('✨ 准备就绪，即将开始播放...');

      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setLoading(false);
        }
      }, 1000);
    };

    initAll();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);
};
