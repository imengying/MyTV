import { API_CONFIG, type ApiSite,getConfig } from '@/lib/config';
import { getCachedSearchPage, setCachedSearchPage } from '@/lib/search-cache';
import { type SearchResult } from '@/lib/types';

import { type ApiSearchItem,buildSearchResultFromApiItem } from './downstream.shared';

async function searchWithCache(
  apiSite: ApiSite,
  query: string,
  page: number,
  url: string,
  timeoutMs = 8000,
): Promise<{ results: SearchResult[]; pageCount?: number }> {
  const cached = getCachedSearchPage(apiSite.key, query, page);
  if (cached) {
    return cached.status === 'ok'
      ? { results: cached.data, pageCount: cached.pageCount }
      : { results: [] };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: API_CONFIG.search.headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 403) {
        setCachedSearchPage(apiSite.key, query, page, 'forbidden', []);
      }
      return { results: [] };
    }

    const data = await response.json();
    if (!data?.list || !Array.isArray(data.list) || data.list.length === 0) {
      return { results: [] };
    }

    const results = (data.list as ApiSearchItem[])
      .map((item) => buildSearchResultFromApiItem(item, apiSite))
      .filter((result) => result.episodes.length > 0);

    const pageCount = page === 1 ? data.pagecount || 1 : undefined;
    setCachedSearchPage(apiSite.key, query, page, 'ok', results, pageCount);
    return { results, pageCount };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const aborted =
      (error instanceof Error && error.name === 'AbortError') ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 20) ||
      (error instanceof Error && error.message.includes('aborted'));
    if (aborted) {
      setCachedSearchPage(apiSite.key, query, page, 'timeout', []);
    }
    return { results: [] };
  }
}

export async function searchFromApi(
  apiSite: ApiSite,
  query: string,
): Promise<SearchResult[]> {
  try {
    const apiBaseUrl = apiSite.api;
    const firstPageUrl =
      apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(query);

    const firstPageResult = await searchWithCache(
      apiSite,
      query,
      1,
      firstPageUrl,
      8000,
    );
    const results = firstPageResult.results;

    const config = await getConfig();
    const maxSearchPages = config.SiteConfig.SearchDownstreamMaxPage;
    const pageCount = firstPageResult.pageCount || 1;
    const pagesToFetch = Math.min(pageCount - 1, maxSearchPages - 1);

    if (pagesToFetch > 0) {
      const additionalResults = await Promise.all(
        Array.from({ length: pagesToFetch }, (_, index) => {
          const page = index + 2;
          const pageUrl =
            apiBaseUrl +
            API_CONFIG.search.pagePath
              .replace('{query}', encodeURIComponent(query))
              .replace('{page}', page.toString());

          return searchWithCache(apiSite, query, page, pageUrl, 8000).then(
            (pageResult) => pageResult.results,
          );
        }),
      );

      additionalResults.forEach((pageResults) => {
        if (pageResults.length > 0) {
          results.push(...pageResults);
        }
      });
    }

    return results;
  } catch {
    return [];
  }
}
