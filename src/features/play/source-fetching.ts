'use client';

import { type SearchResult } from '@/lib/types';

export const fetchSourceDetail = async (
  source: string,
  id: string,
): Promise<SearchResult[]> => {
  try {
    const detailResponse = await fetch(`/api/detail?source=${source}&id=${id}`);
    if (!detailResponse.ok) {
      throw new Error('获取视频详情失败');
    }
    const detailData = (await detailResponse.json()) as SearchResult;
    return [detailData];
  } catch (err) {
    console.error('获取视频详情失败:', err);
    return [];
  }
};

export const fetchSourcesData = async ({
  query,
  currentTitle,
  currentYear,
  searchType,
}: {
  query: string;
  currentTitle: string;
  currentYear: string;
  searchType: string;
}): Promise<{ results: SearchResult[]; sourceSearchError: string | null }> => {
  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(query.trim())}`,
    );
    if (!response.ok) {
      throw new Error('搜索失败');
    }
    const data = await response.json();

    const results = data.results.filter(
      (result: SearchResult) =>
        result.title.replaceAll(' ', '').toLowerCase() ===
          currentTitle.replaceAll(' ', '').toLowerCase() &&
        (currentYear
          ? result.year.toLowerCase() === currentYear.toLowerCase()
          : true) &&
        (searchType
          ? (searchType === 'tv' && result.episodes.length > 1) ||
            (searchType === 'movie' && result.episodes.length === 1)
          : true),
    );

    return { results, sourceSearchError: null };
  } catch (err) {
    return {
      results: [],
      sourceSearchError: err instanceof Error ? err.message : '搜索失败',
    };
  }
};
