'use client';

import { type DoubanItem } from './types';

export type DoubanProxyType =
  | 'direct'
  | 'cmliussss-cdn-tencent'
  | 'cmliussss-cdn-ali'
  | 'cors-anywhere'
  | 'custom';

interface RuntimeConfig {
  DOUBAN_PROXY_TYPE?: DoubanProxyType;
  DOUBAN_PROXY?: string;
}

interface RuntimeWindow extends Window {
  RUNTIME_CONFIG?: RuntimeConfig;
}

export interface DoubanCategoriesParams {
  kind: 'tv' | 'movie';
  category: string;
  type: string;
  pageLimit?: number;
  pageStart?: number;
}

export interface DoubanCategoryApiResponse {
  total: number;
  items: Array<{
    id: string;
    title: string;
    card_subtitle: string;
    pic: {
      large: string;
      normal: string;
    };
    rating: {
      value: number;
    };
  }>;
}

export interface DoubanListParams {
  tag: string;
  type: string;
  pageLimit?: number;
  pageStart?: number;
}

export interface DoubanListApiResponse {
  total: number;
  subjects: Array<{
    id: string;
    title: string;
    card_subtitle: string;
    cover: string;
    rate: string;
  }>;
}

export interface DoubanRecommendsParams {
  kind: 'tv' | 'movie';
  pageLimit?: number;
  pageStart?: number;
  category?: string;
  format?: string;
  label?: string;
  region?: string;
  year?: string;
  platform?: string;
  sort?: string;
}

export interface DoubanRecommendApiResponse {
  total: number;
  items: Array<{
    id: string;
    title: string;
    year: string;
    type: string;
    pic: {
      large: string;
      normal: string;
    };
    rating: {
      value: number;
    };
  }>;
}

export function fetchWithTimeout(url: string, proxyUrl: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const finalUrl =
    proxyUrl === 'https://cors-anywhere.com/'
      ? `${proxyUrl}${url}`
      : proxyUrl
        ? `${proxyUrl}${encodeURIComponent(url)}`
        : url;

  const fetchOptions: RequestInit = {
    signal: controller.signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      Referer: 'https://movie.douban.com/',
      Accept: 'application/json, text/plain, */*',
    },
  };

  return fetch(finalUrl, fetchOptions).finally(() => clearTimeout(timeoutId));
}

export function getDoubanProxyConfig(): {
  proxyType: DoubanProxyType;
  proxyUrl: string;
} {
  const runtimeConfig =
    typeof window === 'undefined'
      ? undefined
      : (window as RuntimeWindow).RUNTIME_CONFIG;

  const proxyType =
    (typeof window !== 'undefined'
      ? localStorage.getItem('doubanDataSource')
      : null) ||
    runtimeConfig?.DOUBAN_PROXY_TYPE ||
    'cmliussss-cdn-tencent';
  const proxyUrl =
    (typeof window !== 'undefined'
      ? localStorage.getItem('doubanProxyUrl')
      : null) ||
    runtimeConfig?.DOUBAN_PROXY ||
    '';

  const normalizedProxyType =
    proxyType === 'cors-proxy-zwei'
      ? 'cmliussss-cdn-tencent'
      : (proxyType as DoubanProxyType);

  return {
    proxyType: normalizedProxyType,
    proxyUrl,
  };
}

export function notifyDoubanError(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('globalError', {
      detail: { message },
    }),
  );
}

export function mapDoubanCategoryItemToCard(item: {
  id: string;
  title: string;
  card_subtitle?: string;
  pic?: { large?: string; normal?: string };
  rating?: { value?: number };
}): DoubanItem {
  return {
    id: item.id,
    title: item.title,
    poster: item.pic?.normal || item.pic?.large || '',
    rate: item.rating?.value ? item.rating.value.toFixed(1) : '',
    year: item.card_subtitle?.match(/(\d{4})/)?.[1] || '',
  };
}

export function buildProxyAwareRequest<T>(
  proxyType: DoubanProxyType,
  proxyUrl: string,
  serverPath: string,
  fetcher: (proxyUrl: string, useTencentCDN?: boolean, useAliCDN?: boolean) => Promise<T>,
) {
  switch (proxyType) {
    case 'cmliussss-cdn-tencent':
      return fetcher('', true, false);
    case 'cmliussss-cdn-ali':
      return fetcher('', false, true);
    case 'cors-anywhere':
      return fetcher('https://cors-anywhere.com/');
    case 'custom':
      return fetcher(proxyUrl);
    case 'direct':
    default:
      return fetch(serverPath).then((response) => response.json() as Promise<T>);
  }
}
