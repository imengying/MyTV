/* eslint-disable no-console */
'use client';

import {
  cacheManager,
  fetchFromApi,
  fetchWithAuth,
  generateStorageKey,
  handleDatabaseOperationFailure,
  triggerGlobalError,
} from './db.client.shared';
import { type PlayRecord } from './db.client.types';

export async function getAllPlayRecords(): Promise<Record<string, PlayRecord>> {
  if (typeof window === 'undefined') {
    return {};
  }

  const cachedData = cacheManager.getCachedPlayRecords();
  if (cachedData) {
    fetchFromApi<Record<string, PlayRecord>>(`/api/playrecords`)
      .then((freshData) => {
        if (JSON.stringify(cachedData) !== JSON.stringify(freshData)) {
          cacheManager.cachePlayRecords(freshData);
          window.dispatchEvent(
            new CustomEvent('playRecordsUpdated', {
              detail: freshData,
            }),
          );
        }
      })
      .catch((err) => {
        console.warn('后台同步播放记录失败:', err);
        triggerGlobalError('后台同步播放记录失败');
      });

    return cachedData;
  }

  try {
    const freshData =
      await fetchFromApi<Record<string, PlayRecord>>(`/api/playrecords`);
    cacheManager.cachePlayRecords(freshData);
    return freshData;
  } catch (err) {
    console.error('获取播放记录失败:', err);
    triggerGlobalError('获取播放记录失败');
    return {};
  }
}

export async function savePlayRecord(
  source: string,
  id: string,
  record: PlayRecord,
): Promise<void> {
  const key = generateStorageKey(source, id);
  const cachedRecords = cacheManager.getCachedPlayRecords() || {};
  cachedRecords[key] = record;
  cacheManager.cachePlayRecords(cachedRecords);

  window.dispatchEvent(
    new CustomEvent('playRecordsUpdated', {
      detail: cachedRecords,
    }),
  );

  try {
    await fetchWithAuth('/api/playrecords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, record }),
    });
  } catch (err) {
    await handleDatabaseOperationFailure('playRecords', err);
    triggerGlobalError('保存播放记录失败');
    throw err;
  }
}

export async function deletePlayRecord(
  source: string,
  id: string,
): Promise<void> {
  const key = generateStorageKey(source, id);
  const cachedRecords = cacheManager.getCachedPlayRecords() || {};
  delete cachedRecords[key];
  cacheManager.cachePlayRecords(cachedRecords);

  window.dispatchEvent(
    new CustomEvent('playRecordsUpdated', {
      detail: cachedRecords,
    }),
  );

  try {
    await fetchWithAuth(`/api/playrecords?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    await handleDatabaseOperationFailure('playRecords', err);
    triggerGlobalError('删除播放记录失败');
    throw err;
  }
}

export async function clearAllPlayRecords(): Promise<void> {
  cacheManager.cachePlayRecords({});
  window.dispatchEvent(
    new CustomEvent('playRecordsUpdated', {
      detail: {},
    }),
  );

  try {
    await fetchWithAuth(`/api/playrecords`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    await handleDatabaseOperationFailure('playRecords', err);
    triggerGlobalError('清空播放记录失败');
    throw err;
  }
}
