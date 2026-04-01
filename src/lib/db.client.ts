 
'use client';

export {
  clearAllFavorites,
  deleteFavorite,
  getAllFavorites,
  isFavorited,
  saveFavorite,
} from './db.client.favorites';
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
  clearUserCache,
  fetchFromApi,
  fetchWithAuth,
  generateStorageKey,
  getCacheStatus,
  preloadUserData,
  refreshAllCache,
  subscribeToDataUpdates,
} from './db.client.shared';
export type { CacheUpdateEvent, Favorite, PlayRecord } from './db.client.types';
