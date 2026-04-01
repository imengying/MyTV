'use client';

import {
  buildProxyAwareRequest,
  type DoubanRecommendApiResponse,
  type DoubanRecommendsParams,
  fetchWithTimeout,
  getDoubanProxyConfig,
} from './douban.client.shared';
import { type DoubanItem, type DoubanResult } from './types';

function normalizeRecommendParam(value?: string) {
  if (!value || value === 'all') return '';
  return value;
}

function buildRecommendTarget(
  params: DoubanRecommendsParams,
  useTencentCDN: boolean,
  useAliCDN: boolean,
) {
  const { kind, pageLimit = 20, pageStart = 0 } = params;
  let { category, format, region, year, platform, sort, label } = params;

  category = normalizeRecommendParam(category);
  format = normalizeRecommendParam(format);
  label = normalizeRecommendParam(label);
  region = normalizeRecommendParam(region);
  year = normalizeRecommendParam(year);
  platform = normalizeRecommendParam(platform);
  if (sort === 'T') {
    sort = '';
  }

  const selectedCategories: Record<string, string> = { 类型: category };
  if (format) {
    selectedCategories['形式'] = format;
  }
  if (region) {
    selectedCategories['地区'] = region;
  }

  const tags: string[] = [];
  if (category) tags.push(category);
  if (!category && format) tags.push(format);
  if (label) tags.push(label);
  if (region) tags.push(region);
  if (year) tags.push(year);
  if (platform) tags.push(platform);

  const baseUrl = useTencentCDN
    ? `https://m.douban.cmliussss.net/rexxar/api/v2/${kind}/recommend`
    : useAliCDN
      ? `https://m.douban.cmliussss.com/rexxar/api/v2/${kind}/recommend`
      : `https://m.douban.com/rexxar/api/v2/${kind}/recommend`;
  const reqParams = new URLSearchParams();
  reqParams.append('refresh', '0');
  reqParams.append('start', pageStart.toString());
  reqParams.append('count', pageLimit.toString());
  reqParams.append('selected_categories', JSON.stringify(selectedCategories));
  reqParams.append('uncollect', 'false');
  reqParams.append('score_range', '0,10');
  reqParams.append('tags', tags.join(','));
  if (sort) {
    reqParams.append('sort', sort);
  }

  return `${baseUrl}?${reqParams.toString()}`;
}

async function fetchDoubanRecommends(
  params: DoubanRecommendsParams,
  proxyUrl: string,
  useTencentCDN = false,
  useAliCDN = false,
): Promise<DoubanResult> {
  const target = buildRecommendTarget(params, useTencentCDN, useAliCDN);

  try {
    const response = await fetchWithTimeout(
      target,
      useTencentCDN || useAliCDN ? '' : proxyUrl,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const doubanData: DoubanRecommendApiResponse = await response.json();
    const list: DoubanItem[] = doubanData.items
      .filter((item) => item.type === 'movie' || item.type === 'tv')
      .map((item) => ({
        id: item.id,
        title: item.title,
        poster: item.pic?.normal || item.pic?.large || '',
        rate: item.rating?.value ? item.rating.value.toFixed(1) : '',
        year: item.year,
      }));

    return {
      code: 200,
      message: '获取成功',
      list,
    };
  } catch (error) {
    throw new Error(`获取豆瓣推荐数据失败: ${(error as Error).message}`);
  }
}

export async function getDoubanRecommends(
  params: DoubanRecommendsParams,
): Promise<DoubanResult> {
  const {
    kind,
    pageLimit = 20,
    pageStart = 0,
    category,
    format,
    label,
    region,
    year,
    platform,
    sort,
  } = params;
  const { proxyType, proxyUrl } = getDoubanProxyConfig();

  return buildProxyAwareRequest(
    proxyType,
    proxyUrl,
    `/api/douban/recommends?kind=${kind}&limit=${pageLimit}&start=${pageStart}&category=${category}&format=${format}&region=${region}&year=${year}&platform=${platform}&sort=${sort}&label=${label}`,
    (resolvedProxyUrl, useTencentCDN, useAliCDN) =>
      fetchDoubanRecommends(
        params,
        resolvedProxyUrl,
        useTencentCDN,
        useAliCDN,
      ),
  );
}
