/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console */

'use client';

import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

import PageLayout from '@/components/PageLayout';

import {
  cleanupPlayer,
  initializeArtPlayer,
  releaseWakeLock,
  requestWakeLock,
  switchExistingPlayer,
} from '@/features/play/player-core';
import {
  PlayDetailsSection,
  PlayErrorState,
  PlayLoadingState,
  PlayPlayerSection,
} from '@/features/play/ui';
import { usePlayBootstrap } from '@/features/play/use-play-bootstrap';
import { usePlaybackSession } from '@/features/play/use-playback-session';

// 扩展 HTMLVideoElement 类型以支持 hls 属性
declare global {
  interface HTMLVideoElement {
    hls?: any;
  }
}

function PlayPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTitle = searchParams.get('title') || '';
  const initialYear = searchParams.get('year') || '';
  const initialSource = searchParams.get('source') || '';
  const initialId = searchParams.get('id') || '';
  const searchTitle = searchParams.get('stitle') || '';
  const searchType = searchParams.get('stype') || '';
  const initialNeedPrefer = searchParams.get('prefer') === 'true';

  const artPlayerRef = useRef<any>(null);
  const artRef = useRef<HTMLDivElement | null>(null);
  const {
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
    currentEpisodeIndex,
    videoUrl,
    totalEpisodes,
    availableSources,
    sourceSearchLoading,
    sourceSearchError,
    precomputedVideoInfo,
    isEpisodeSelectorCollapsed,
    isVideoLoading,
    videoLoadingStage,
    currentSourceRef,
    currentIdRef,
    videoTitleRef,
    detailRef,
    currentEpisodeIndexRef,
    resumeTimeRef,
    lastVolumeRef,
    lastPlaybackRateRef,
    lastSaveTimeRef,
    wakeLockRef,
    setError,
    setVideoTitle,
    setVideoYear,
    setVideoCover,
    setVideoDoubanId,
    setCurrentSource,
    setCurrentId,
    setDetail,
    setCurrentEpisodeIndex,
    setIsEpisodeSelectorCollapsed,
    setIsVideoLoading,
    setVideoLoadingStage,
  } = usePlayBootstrap({
    initialTitle,
    initialYear,
    initialSource,
    initialId,
    initialSearchTitle: searchTitle,
    initialSearchType: searchType,
    initialNeedPrefer,
  });

  const {
    favorited,
    handleToggleFavorite,
    handleSourceChange,
    handleEpisodeChange,
    handleNextEpisode,
    saveCurrentPlayProgress,
  } = usePlaybackSession({
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
  });

  useEffect(() => {
    if (
      !Artplayer ||
      !Hls ||
      !videoUrl ||
      loading ||
      currentEpisodeIndex === null ||
      !artRef.current
    ) {
      return;
    }

    // 确保选集索引有效
    if (
      !detail ||
      !detail.episodes ||
      currentEpisodeIndex >= detail.episodes.length ||
      currentEpisodeIndex < 0
    ) {
      setError(`选集索引无效，当前共 ${totalEpisodes} 集`);
      return;
    }

    if (!videoUrl) {
      setError('视频地址无效');
      return;
    }
    console.log(videoUrl);

    // 检测是否为WebKit浏览器
    const isWebkit =
      typeof window !== 'undefined' &&
      typeof (window as any).webkitConvertPointFromNodeToPage === 'function';

    // 非WebKit浏览器且播放器已存在，使用switch方法切换
    if (!isWebkit && artPlayerRef.current) {
      switchExistingPlayer({
        artPlayerRef,
        videoUrl,
        videoTitle,
        currentEpisodeIndex,
        videoCover,
      });
      return;
    }

    // WebKit浏览器或首次创建：销毁之前的播放器实例并创建新的
    if (artPlayerRef.current) {
      cleanupPlayer(artPlayerRef);
    }

    try {
      initializeArtPlayer({
        Artplayer,
        Hls,
        artRef,
        artPlayerRef,
        videoUrl,
        videoCover,
        videoTitle,
        currentEpisodeIndex,
        isWebkit,
        handleNextEpisode,
        saveCurrentPlayProgress,
        resumeTimeRef,
        lastVolumeRef,
        lastPlaybackRateRef,
        lastSaveTimeRef,
        detailRef,
        currentEpisodeIndexRef,
        setCurrentEpisodeIndex,
        setIsVideoLoading,
        setError,
        requestWakeLock: () => requestWakeLock(wakeLockRef),
        releaseWakeLock: () => releaseWakeLock(wakeLockRef),
      });
    } catch (err) {
      console.error('创建播放器失败:', err);
      setError('播放器初始化失败');
    }
  }, [Artplayer, Hls, videoUrl, loading]);

  // 当组件卸载时清理 Wake Lock 和播放器资源
  useEffect(() => {
    return () => {
      releaseWakeLock(wakeLockRef);
      cleanupPlayer(artPlayerRef);
    };
  }, []);

  if (loading) {
    return (
      <PlayLoadingState
        loadingStage={loadingStage}
        loadingMessage={loadingMessage}
      />
    );
  }

  if (error) {
    return (
      <PlayErrorState
        error={error}
        videoTitle={videoTitle}
        onBack={() =>
          videoTitle
            ? router.push(`/search?q=${encodeURIComponent(videoTitle)}`)
            : router.back()
        }
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <PageLayout activePath='/play'>
      <div className='flex flex-col gap-3 py-4 px-5 lg:px-12 2xl:px-20'>
        <PlayPlayerSection
          videoTitle={videoTitle}
          totalEpisodes={totalEpisodes}
          currentEpisodeIndex={currentEpisodeIndex}
          detail={detail}
          isEpisodeSelectorCollapsed={isEpisodeSelectorCollapsed}
          onToggleEpisodeSelector={() =>
            setIsEpisodeSelectorCollapsed(!isEpisodeSelectorCollapsed)
          }
          artRef={artRef}
          isVideoLoading={isVideoLoading}
          videoLoadingStage={videoLoadingStage}
          onEpisodeChange={(episodeNumber) =>
            handleEpisodeChange(episodeNumber, totalEpisodes)
          }
          onSourceChange={handleSourceChange}
          currentSource={currentSource}
          currentId={currentId}
          searchTitle={searchTitle}
          availableSources={availableSources}
          sourceSearchLoading={sourceSearchLoading}
          sourceSearchError={sourceSearchError}
          precomputedVideoInfo={precomputedVideoInfo}
        />

        <PlayDetailsSection
          videoTitle={videoTitle}
          detail={detail}
          favorited={favorited}
          onToggleFavorite={handleToggleFavorite}
          videoCover={videoCover}
          videoDoubanId={videoDoubanId}
          videoYear={videoYear}
        />
      </div>
    </PageLayout>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayPageClient />
    </Suspense>
  );
}
