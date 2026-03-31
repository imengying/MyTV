/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
'use client';

import { type Favorite } from './db.client.types';
import {
  cacheManager,
  fetchFromApi,
  fetchWithAuth,
  generateStorageKey,
  handleDatabaseOperationFailure,
  triggerGlobalError,
} from './db.client.shared';

export async function getAllFavorites(): Promise<Record<string, Favorite>> {
  if (typeof window === 'undefined') {
    return {};
  }
  const cachedData = cacheManager.getCachedFavorites();
  if (cachedData) {
    fetchFromApi<Record<string, Favorite>>(`/api/favorites`)
      .then((freshData) => {
        if (JSON.stringify(cachedData) !== JSON.stringify(freshData)) {
          cacheManager.cacheFavorites(freshData);
          window.dispatchEvent(
            new CustomEvent('favoritesUpdated', {
              detail: freshData,
            }),
          );
        }
      })
      .catch((err) => {
        console.warn('后台同步收藏失败:', err);
        triggerGlobalError('后台同步收藏失败');
      });

    return cachedData;
  }

  try {
    const freshData =
      await fetchFromApi<Record<string, Favorite>>(`/api/favorites`);
    cacheManager.cacheFavorites(freshData);
    return freshData;
  } catch (err) {
    console.error('获取收藏失败:', err);
    triggerGlobalError('获取收藏失败');
    return {};
  }
}

export async function saveFavorite(
  source: string,
  id: string,
  favorite: Favorite,
): Promise<void> {
  const key = generateStorageKey(source, id);
  const cachedFavorites = cacheManager.getCachedFavorites() || {};
  cachedFavorites[key] = favorite;
  cacheManager.cacheFavorites(cachedFavorites);

  window.dispatchEvent(
    new CustomEvent('favoritesUpdated', {
      detail: cachedFavorites,
    }),
  );

  try {
    await fetchWithAuth('/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, favorite }),
    });
  } catch (err) {
    await handleDatabaseOperationFailure('favorites', err);
    triggerGlobalError('保存收藏失败');
    throw err;
  }
}

export async function deleteFavorite(
  source: string,
  id: string,
): Promise<void> {
  const key = generateStorageKey(source, id);
  const cachedFavorites = cacheManager.getCachedFavorites() || {};
  delete cachedFavorites[key];
  cacheManager.cacheFavorites(cachedFavorites);

  window.dispatchEvent(
    new CustomEvent('favoritesUpdated', {
      detail: cachedFavorites,
    }),
  );

  try {
    await fetchWithAuth(`/api/favorites?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    await handleDatabaseOperationFailure('favorites', err);
    triggerGlobalError('删除收藏失败');
    throw err;
  }
}

export async function isFavorited(
  source: string,
  id: string,
): Promise<boolean> {
  const key = generateStorageKey(source, id);
  const cachedFavorites = cacheManager.getCachedFavorites();

  if (cachedFavorites) {
    fetchFromApi<Record<string, Favorite>>(`/api/favorites`)
      .then((freshData) => {
        if (JSON.stringify(cachedFavorites) !== JSON.stringify(freshData)) {
          cacheManager.cacheFavorites(freshData);
          window.dispatchEvent(
            new CustomEvent('favoritesUpdated', {
              detail: freshData,
            }),
          );
        }
      })
      .catch((err) => {
        console.warn('后台同步收藏失败:', err);
        triggerGlobalError('后台同步收藏失败');
      });

    return !!cachedFavorites[key];
  }

  try {
    const freshData =
      await fetchFromApi<Record<string, Favorite>>(`/api/favorites`);
    cacheManager.cacheFavorites(freshData);
    return !!freshData[key];
  } catch (err) {
    console.error('检查收藏状态失败:', err);
    triggerGlobalError('检查收藏状态失败');
    return false;
  }
}

export async function clearAllFavorites(): Promise<void> {
  cacheManager.cacheFavorites({});
  window.dispatchEvent(
    new CustomEvent('favoritesUpdated', {
      detail: {},
    }),
  );

  try {
    await fetchWithAuth(`/api/favorites`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    await handleDatabaseOperationFailure('favorites', err);
    triggerGlobalError('清空收藏失败');
    throw err;
  }
}
