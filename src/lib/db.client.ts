/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
'use client';

export type { CacheUpdateEvent, Favorite, PlayRecord } from './db.client.types';

export {
  clearUserCache,
  fetchFromApi,
  fetchWithAuth,
  generateStorageKey,
  getCacheStatus,
  preloadUserData,
  refreshAllCache,
  subscribeToDataUpdates,
} from './db.client.shared';

export {
  clearAllPlayRecords,
  deletePlayRecord,
  getAllPlayRecords,
  savePlayRecord,
} from './db.client.play-records';

export {
  addSearchHistory,
  clearSearchHistory,
  deleteSearchHistory,
  getSearchHistory,
} from './db.client.search-history';

export {
  clearAllFavorites,
  deleteFavorite,
  getAllFavorites,
  isFavorited,
  saveFavorite,
} from './db.client.favorites';
