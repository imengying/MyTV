'use client';

import { type MutableRefObject,useEffect, useState } from 'react';

import {
  deleteFavorite,
  generateStorageKey,
  isFavorited,
  saveFavorite,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { type SearchResult } from '@/lib/types';

interface UsePlaybackFavoriteParams {
  currentSource: string;
  currentId: string;
  searchTitle: string;
  currentSourceRef: MutableRefObject<string>;
  currentIdRef: MutableRefObject<string>;
  videoTitleRef: MutableRefObject<string>;
  detailRef: MutableRefObject<SearchResult | null>;
}

export const usePlaybackFavorite = ({
  currentSource,
  currentId,
  searchTitle,
  currentSourceRef,
  currentIdRef,
  videoTitleRef,
  detailRef,
}: UsePlaybackFavoriteParams) => {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!currentSource || !currentId) return;

    (async () => {
      try {
        const fav = await isFavorited(currentSource, currentId);
        setFavorited(fav);
      } catch {
      }
    })();
  }, [currentId, currentSource]);

  useEffect(() => {
    if (!currentSource || !currentId) return;

    const unsubscribe = subscribeToDataUpdates<Record<string, unknown>>(
      'favoritesUpdated',
      (favorites) => {
        const key = generateStorageKey(currentSource, currentId);
        setFavorited(!!favorites[key]);
      },
    );

    return unsubscribe;
  }, [currentId, currentSource]);

  const handleToggleFavorite = async () => {
    if (
      !videoTitleRef.current ||
      !detailRef.current ||
      !currentSourceRef.current ||
      !currentIdRef.current
    ) {
      return;
    }

    try {
      if (favorited) {
        await deleteFavorite(currentSourceRef.current, currentIdRef.current);
        setFavorited(false);
        return;
      }

      await saveFavorite(currentSourceRef.current, currentIdRef.current, {
        title: videoTitleRef.current,
        source_name: detailRef.current?.source_name || '',
        year: detailRef.current?.year,
        cover: detailRef.current?.poster || '',
        total_episodes: detailRef.current?.episodes.length || 1,
        save_time: Date.now(),
        search_title: searchTitle,
      });
      setFavorited(true);
    } catch {
    }
  };

  return {
    favorited,
    handleToggleFavorite,
  };
};
