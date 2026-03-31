'use client';

import { type SearchResult } from '@/lib/types';

import { fetchSourceDetail, fetchSourcesData } from '@/features/play/source-fetching';
import { preferBestSource } from '@/features/play/source-scoring';
import { type SourceVideoInfo } from '@/features/play/source-selection.types';

export type { SourceVideoInfo } from '@/features/play/source-selection.types';
export { calculateSourceScore, preferBestSource } from '@/features/play/source-scoring';

export const resolveVideoUrl = (
  detailData: SearchResult | null,
  episodeIndex: number,
): string => {
  if (
    !detailData ||
    !detailData.episodes ||
    episodeIndex >= detailData.episodes.length
  ) {
    return '';
  }

  return detailData.episodes[episodeIndex] || '';
};
export const resolveInitialPlaybackSession = async ({
  currentSource,
  currentId,
  videoTitle,
  searchTitle,
  searchType,
  needPrefer,
  optimizationEnabled,
  currentTitle,
  currentYear,
}: {
  currentSource: string;
  currentId: string;
  videoTitle: string;
  searchTitle: string;
  searchType: string;
  needPrefer: boolean;
  optimizationEnabled: boolean;
  currentTitle: string;
  currentYear: string;
}): Promise<{
  availableSources: SearchResult[];
  detailData: SearchResult;
  precomputedVideoInfo: Map<string, SourceVideoInfo>;
  sourceSearchError: string | null;
}> => {
  let sourceSearchError: string | null = null;
  let availableSources: SearchResult[] = [];

  const searchResult = await fetchSourcesData({
    query: searchTitle || videoTitle,
    currentTitle,
    currentYear,
    searchType,
  });
  availableSources = searchResult.results;
  sourceSearchError = searchResult.sourceSearchError;

  if (
    currentSource &&
    currentId &&
    !availableSources.some(
      (source) => source.source === currentSource && source.id === currentId,
    )
  ) {
    availableSources = await fetchSourceDetail(currentSource, currentId);
  }

  if (availableSources.length === 0) {
    throw new Error('未找到匹配结果');
  }

  let detailData: SearchResult = availableSources[0];
  let precomputedVideoInfo = new Map<string, SourceVideoInfo>();

  if (currentSource && currentId && !needPrefer) {
    const target = availableSources.find(
      (source) => source.source === currentSource && source.id === currentId,
    );
    if (!target) {
      throw new Error('未找到匹配结果');
    }
    detailData = target;
  }

  if ((!currentSource || !currentId || needPrefer) && optimizationEnabled) {
    const preferredResult = await preferBestSource(availableSources);
    detailData = preferredResult.bestSource;
    precomputedVideoInfo = preferredResult.precomputedVideoInfo;
  }

  return {
    availableSources,
    detailData,
    precomputedVideoInfo,
    sourceSearchError,
  };
};

export const resolveSourceChange = ({
  availableSources,
  newSource,
  newId,
  currentEpisodeIndex,
  currentPlayTime,
  currentResumeTime,
}: {
  availableSources: SearchResult[];
  newSource: string;
  newId: string;
  currentEpisodeIndex: number;
  currentPlayTime: number;
  currentResumeTime: number | null;
}): {
  detailData: SearchResult;
  targetIndex: number;
  nextResumeTime: number;
} => {
  const newDetail = availableSources.find(
    (source) => source.source === newSource && source.id === newId,
  );

  if (!newDetail) {
    throw new Error('未找到匹配结果');
  }

  let targetIndex = currentEpisodeIndex;
  if (!newDetail.episodes || targetIndex >= newDetail.episodes.length) {
    targetIndex = 0;
  }

  let nextResumeTime = 0;
  if (targetIndex === currentEpisodeIndex) {
    if ((!currentResumeTime || currentResumeTime === 0) && currentPlayTime > 1) {
      nextResumeTime = currentPlayTime;
    } else {
      nextResumeTime = currentResumeTime || 0;
    }
  }

  return {
    detailData: newDetail,
    targetIndex,
    nextResumeTime,
  };
};
