'use client';

import {
  buildProxyAwareRequest,
  type DoubanCategoriesParams,
  type DoubanCategoryApiResponse,
  fetchWithTimeout,
  getDoubanProxyConfig,
  mapDoubanCategoryItemToCard,
  notifyDoubanError,
} from './douban.client.shared';
import { type DoubanResult } from './types';

export async function fetchDoubanCategories(
  params: DoubanCategoriesParams,
  proxyUrl: string,
  useTencentCDN = false,
  useAliCDN = false,
): Promise<DoubanResult> {
  const { kind, category, type, pageLimit = 20, pageStart = 0 } = params;

  if (!['tv', 'movie'].includes(kind)) {
    throw new Error('kind 参数必须是 tv 或 movie');
  }
  if (!category || !type) {
    throw new Error('category 和 type 参数不能为空');
  }
  if (pageLimit < 1 || pageLimit > 100) {
    throw new Error('pageLimit 必须在 1-100 之间');
  }
  if (pageStart < 0) {
    throw new Error('pageStart 不能小于 0');
  }

  const target = useTencentCDN
    ? `https://m.douban.cmliussss.net/rexxar/api/v2/subject/recent_hot/${kind}?start=${pageStart}&limit=${pageLimit}&category=${category}&type=${type}`
    : useAliCDN
      ? `https://m.douban.cmliussss.com/rexxar/api/v2/subject/recent_hot/${kind}?start=${pageStart}&limit=${pageLimit}&category=${category}&type=${type}`
      : `https://m.douban.com/rexxar/api/v2/subject/recent_hot/${kind}?start=${pageStart}&limit=${pageLimit}&category=${category}&type=${type}`;

  try {
    const response = await fetchWithTimeout(
      target,
      useTencentCDN || useAliCDN ? '' : proxyUrl,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const doubanData: DoubanCategoryApiResponse = await response.json();
    return {
      code: 200,
      message: '获取成功',
      list: doubanData.items.map(mapDoubanCategoryItemToCard),
    };
  } catch (error) {
    notifyDoubanError('获取豆瓣分类数据失败');
    throw new Error(`获取豆瓣分类数据失败: ${(error as Error).message}`);
  }
}

export async function getDoubanCategories(
  params: DoubanCategoriesParams,
): Promise<DoubanResult> {
  const { kind, category, type, pageLimit = 20, pageStart = 0 } = params;
  const { proxyType, proxyUrl } = getDoubanProxyConfig();

  return buildProxyAwareRequest(
    proxyType,
    proxyUrl,
    `/api/douban/categories?kind=${kind}&category=${category}&type=${type}&limit=${pageLimit}&start=${pageStart}`,
    (resolvedProxyUrl, useTencentCDN, useAliCDN) =>
      fetchDoubanCategories(
        params,
        resolvedProxyUrl,
        useTencentCDN,
        useAliCDN,
      ),
  );
}
