import { API_CONFIG, type ApiSite } from '@/lib/config';
import { type SearchResult } from '@/lib/types';

import {
  buildDetailResultFromApiItem,
  buildSpecialSourceDetailResult,
  type ApiSearchItem,
} from './downstream.shared';

async function fetchTextWithTimeout(
  url: string,
  headers: HeadersInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(url, {
    headers,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  return response;
}

async function handleSpecialSourceDetail(
  id: string,
  apiSite: ApiSite,
): Promise<SearchResult> {
  const detailUrl = `${apiSite.detail}/index.php/vod/detail/id/${id}.html`;
  const response = await fetchTextWithTimeout(
    detailUrl,
    API_CONFIG.detail.headers,
    10000,
  );

  if (!response.ok) {
    throw new Error(`详情页请求失败: ${response.status}`);
  }

  const html = await response.text();
  return buildSpecialSourceDetailResult({ html, id, apiSite });
}

export async function getDetailFromApi(
  apiSite: ApiSite,
  id: string,
): Promise<SearchResult> {
  if (apiSite.detail) {
    return handleSpecialSourceDetail(id, apiSite);
  }

  const detailUrl = `${apiSite.api}${API_CONFIG.detail.path}${id}`;
  const response = await fetchTextWithTimeout(
    detailUrl,
    API_CONFIG.detail.headers,
    10000,
  );

  if (!response.ok) {
    throw new Error(`详情请求失败: ${response.status}`);
  }

  const data = await response.json();
  if (!data?.list || !Array.isArray(data.list) || data.list.length === 0) {
    throw new Error('获取到的详情内容无效');
  }

  return buildDetailResultFromApiItem({
    item: data.list[0] as ApiSearchItem,
    id,
    apiSite,
  });
}
