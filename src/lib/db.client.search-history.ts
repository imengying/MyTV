/* eslint-disable no-console */
'use client';

import {
  cacheManager,
  fetchFromApi,
  fetchWithAuth,
  handleDatabaseOperationFailure,
  triggerGlobalError,
} from './db.client.shared';

const SEARCH_HISTORY_LIMIT = 20;

export async function getSearchHistory(): Promise<string[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  const cachedData = cacheManager.getCachedSearchHistory();
  if (cachedData) {
    fetchFromApi<string[]>(`/api/searchhistory`)
      .then((freshData) => {
        if (JSON.stringify(cachedData) !== JSON.stringify(freshData)) {
          cacheManager.cacheSearchHistory(freshData);
          window.dispatchEvent(
            new CustomEvent('searchHistoryUpdated', {
              detail: freshData,
            }),
          );
        }
      })
      .catch((err) => {
        console.warn('后台同步搜索历史失败:', err);
        triggerGlobalError('后台同步搜索历史失败');
      });

    return cachedData;
  }

  try {
    const freshData = await fetchFromApi<string[]>(`/api/searchhistory`);
    cacheManager.cacheSearchHistory(freshData);
    return freshData;
  } catch (err) {
    console.error('获取搜索历史失败:', err);
    triggerGlobalError('获取搜索历史失败');
    return [];
  }
}

export async function addSearchHistory(keyword: string): Promise<void> {
  const trimmed = keyword.trim();
  if (!trimmed) return;
  const cachedHistory = cacheManager.getCachedSearchHistory() || [];
  const newHistory = [trimmed, ...cachedHistory.filter((k) => k !== trimmed)];
  if (newHistory.length > SEARCH_HISTORY_LIMIT) {
    newHistory.length = SEARCH_HISTORY_LIMIT;
  }
  cacheManager.cacheSearchHistory(newHistory);

  window.dispatchEvent(
    new CustomEvent('searchHistoryUpdated', {
      detail: newHistory,
    }),
  );

  try {
    await fetchWithAuth('/api/searchhistory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword: trimmed }),
    });
  } catch (err) {
    await handleDatabaseOperationFailure('searchHistory', err);
  }
}

export async function clearSearchHistory(): Promise<void> {
  cacheManager.cacheSearchHistory([]);
  window.dispatchEvent(
    new CustomEvent('searchHistoryUpdated', {
      detail: [],
    }),
  );

  try {
    await fetchWithAuth(`/api/searchhistory`, {
      method: 'DELETE',
    });
  } catch (err) {
    await handleDatabaseOperationFailure('searchHistory', err);
  }
}

export async function deleteSearchHistory(keyword: string): Promise<void> {
  const trimmed = keyword.trim();
  if (!trimmed) return;
  const cachedHistory = cacheManager.getCachedSearchHistory() || [];
  const newHistory = cachedHistory.filter((k) => k !== trimmed);
  cacheManager.cacheSearchHistory(newHistory);

  window.dispatchEvent(
    new CustomEvent('searchHistoryUpdated', {
      detail: newHistory,
    }),
  );

  try {
    await fetchWithAuth(
      `/api/searchhistory?keyword=${encodeURIComponent(trimmed)}`,
      {
        method: 'DELETE',
      },
    );
  } catch (err) {
    await handleDatabaseOperationFailure('searchHistory', err);
  }
}
