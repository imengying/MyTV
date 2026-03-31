/* eslint-disable no-console,react-hooks/exhaustive-deps,@typescript-eslint/no-explicit-any */

'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getDoubanCategories,
  getDoubanRecommends,
} from '@/lib/douban.client';
import { DoubanItem, DoubanResult } from '@/lib/types';

import DoubanCardSkeleton from '@/components/DoubanCardSkeleton';
import DoubanSelector from '@/components/DoubanSelector';
import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';
import VirtualGrid from '@/components/VirtualGrid';

function DoubanPageClient() {
  const searchParams = useSearchParams();
  const [doubanData, setDoubanData] = useState<DoubanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectorsReady, setSelectorsReady] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentParamsRef = useRef({
    type: '',
    primarySelection: '',
    secondarySelection: '',
    multiLevelSelection: {} as Record<string, string>,
    currentPage: 0,
  });

  const searchType = searchParams.get('type') || 'movie';
  const type = ['movie', 'tv', 'show', 'anime', 'short'].includes(searchType)
    ? searchType
    : 'movie';

  const [primarySelection, setPrimarySelection] = useState<string>(() => {
    if (type === 'movie') return '热门';
    if (type === 'tv' || type === 'show') return '最近热门';
    if (type === 'anime') return '全部';
    if (type === 'short') return '全部';
    return '';
  });
  const [secondarySelection, setSecondarySelection] = useState<string>(() => {
    if (type === 'movie') return '全部';
    if (type === 'tv') return 'tv';
    if (type === 'show') return 'show';
    return '全部';
  });

  const [multiLevelValues, setMultiLevelValues] = useState<
    Record<string, string>
  >({
    type: 'all',
    region: 'all',
    year: 'all',
    platform: 'all',
    label: 'all',
    sort: 'T',
  });

  useEffect(() => {
    currentParamsRef.current = {
      type,
      primarySelection,
      secondarySelection,
      multiLevelSelection: multiLevelValues,
      currentPage,
    };
  }, [type, primarySelection, secondarySelection, multiLevelValues, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectorsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setSelectorsReady(false);
    setLoading(true);
  }, [type]);

  useEffect(() => {
    if (type === 'movie') {
      setPrimarySelection('热门');
      setSecondarySelection('全部');
    } else if (type === 'tv') {
      setPrimarySelection('最近热门');
      setSecondarySelection('tv');
    } else if (type === 'show') {
      setPrimarySelection('最近热门');
      setSecondarySelection('show');
    } else if (type === 'anime') {
      setPrimarySelection('全部');
      setSecondarySelection('全部');
    } else if (type === 'short') {
      setPrimarySelection('全部');
      setSecondarySelection('全部');
    } else {
      setPrimarySelection('');
      setSecondarySelection('全部');
    }

    setMultiLevelValues({
      type: 'all',
      region: 'all',
      year: 'all',
      platform: 'all',
      label: 'all',
      sort: 'T',
    });

    const timer = setTimeout(() => {
      setSelectorsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [type]);

  const skeletonData = Array.from({ length: 25 }, (_, index) => index);

  const isSnapshotEqual = useCallback(
    (
      snapshot1: {
        type: string;
        primarySelection: string;
        secondarySelection: string;
        multiLevelSelection: Record<string, string>;
        currentPage: number;
      },
      snapshot2: {
        type: string;
        primarySelection: string;
        secondarySelection: string;
        multiLevelSelection: Record<string, string>;
        currentPage: number;
      },
    ) => {
      return (
        snapshot1.type === snapshot2.type &&
        snapshot1.primarySelection === snapshot2.primarySelection &&
        snapshot1.secondarySelection === snapshot2.secondarySelection &&
        snapshot1.currentPage === snapshot2.currentPage &&
        JSON.stringify(snapshot1.multiLevelSelection) ===
          JSON.stringify(snapshot2.multiLevelSelection)
      );
    },
    [],
  );

  const getRequestParams = useCallback(
    (pageStart: number) => {
      if (type === 'tv' || type === 'show') {
        return {
          kind: 'tv' as const,
          category: type,
          type: secondarySelection,
          pageLimit: 25,
          pageStart,
        };
      }

      return {
        kind: type as 'tv' | 'movie',
        category: primarySelection,
        type: secondarySelection,
        pageLimit: 25,
        pageStart,
      };
    },
    [type, primarySelection, secondarySelection],
  );

  const loadInitialData = useCallback(async () => {
    const requestSnapshot = {
      type,
      primarySelection,
      secondarySelection,
      multiLevelSelection: multiLevelValues,
      currentPage: 0,
    };

    try {
      setLoading(true);
      setDoubanData([]);
      setCurrentPage(0);
      setHasMore(true);
      setIsLoadingMore(false);

      let data: DoubanResult;

      if (type === 'anime') {
        data = await getDoubanRecommends({
          kind: 'tv',
          pageLimit: 25,
          pageStart: 0,
          category: '动画',
          format: '电视剧',
          region: multiLevelValues.region
            ? (multiLevelValues.region as string)
            : '',
          year: multiLevelValues.year ? (multiLevelValues.year as string) : '',
          platform: multiLevelValues.platform
            ? (multiLevelValues.platform as string)
            : '',
          sort: multiLevelValues.sort ? (multiLevelValues.sort as string) : '',
          label: multiLevelValues.label
            ? (multiLevelValues.label as string)
            : '',
        });
      } else if (type === 'short') {
        data = await getDoubanRecommends({
          kind: 'tv',
          pageLimit: 25,
          pageStart: 0,
          category: multiLevelValues.type
            ? (multiLevelValues.type as string)
            : '',
          format: '电视剧',
          region: multiLevelValues.region
            ? (multiLevelValues.region as string)
            : '',
          year: multiLevelValues.year ? (multiLevelValues.year as string) : '',
          platform: multiLevelValues.platform
            ? (multiLevelValues.platform as string)
            : '',
          sort: multiLevelValues.sort ? (multiLevelValues.sort as string) : '',
          label: '短剧',
        });
      } else if (primarySelection === '全部') {
        data = await getDoubanRecommends({
          kind: type === 'show' ? 'tv' : (type as 'tv' | 'movie'),
          pageLimit: 25,
          pageStart: 0,
          category: multiLevelValues.type
            ? (multiLevelValues.type as string)
            : '',
          format: type === 'show' ? '综艺' : type === 'tv' ? '电视剧' : '',
          region: multiLevelValues.region
            ? (multiLevelValues.region as string)
            : '',
          year: multiLevelValues.year ? (multiLevelValues.year as string) : '',
          platform: multiLevelValues.platform
            ? (multiLevelValues.platform as string)
            : '',
          sort: multiLevelValues.sort ? (multiLevelValues.sort as string) : '',
          label: multiLevelValues.label
            ? (multiLevelValues.label as string)
            : '',
        });
      } else {
        data = await getDoubanCategories(getRequestParams(0));
      }

      if (data.code === 200) {
        const currentSnapshot = { ...currentParamsRef.current };

        if (isSnapshotEqual(requestSnapshot, currentSnapshot)) {
          setDoubanData(data.list);
          setHasMore(data.list.length !== 0);
          setLoading(false);
        } else {
          console.log('参数不一致，不执行任何操作，避免设置过期数据');
        }
      } else {
        throw new Error(data.message || '获取数据失败');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [
    type,
    primarySelection,
    secondarySelection,
    multiLevelValues,
    getRequestParams,
    isSnapshotEqual,
  ]);

  useEffect(() => {
    if (!selectorsReady) {
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      loadInitialData();
    }, 100);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    selectorsReady,
    type,
    primarySelection,
    secondarySelection,
    multiLevelValues,
    loadInitialData,
  ]);

  useEffect(() => {
    if (currentPage <= 0) {
      return;
    }

    const fetchMoreData = async () => {
      const requestSnapshot = {
        type,
        primarySelection,
        secondarySelection,
        multiLevelSelection: multiLevelValues,
        currentPage,
      };

      try {
        setIsLoadingMore(true);

        let data: DoubanResult;
        if (type === 'anime') {
          data = await getDoubanRecommends({
            kind: 'tv',
            pageLimit: 25,
            pageStart: currentPage * 25,
            category: '动画',
            format: '电视剧',
            region: multiLevelValues.region
              ? (multiLevelValues.region as string)
              : '',
            year: multiLevelValues.year
              ? (multiLevelValues.year as string)
              : '',
            platform: multiLevelValues.platform
              ? (multiLevelValues.platform as string)
              : '',
            sort: multiLevelValues.sort
              ? (multiLevelValues.sort as string)
              : '',
            label: multiLevelValues.label
              ? (multiLevelValues.label as string)
              : '',
          });
        } else if (type === 'short') {
          data = await getDoubanRecommends({
            kind: 'tv',
            pageLimit: 25,
            pageStart: currentPage * 25,
            category: multiLevelValues.type
              ? (multiLevelValues.type as string)
              : '',
            format: '电视剧',
            region: multiLevelValues.region
              ? (multiLevelValues.region as string)
              : '',
            year: multiLevelValues.year
              ? (multiLevelValues.year as string)
              : '',
            platform: multiLevelValues.platform
              ? (multiLevelValues.platform as string)
              : '',
            sort: multiLevelValues.sort
              ? (multiLevelValues.sort as string)
              : '',
            label: '短剧',
          });
        } else if (primarySelection === '全部') {
          data = await getDoubanRecommends({
            kind: type === 'show' ? 'tv' : (type as 'tv' | 'movie'),
            pageLimit: 25,
            pageStart: currentPage * 25,
            category: multiLevelValues.type
              ? (multiLevelValues.type as string)
              : '',
            format: type === 'show' ? '综艺' : type === 'tv' ? '电视剧' : '',
            region: multiLevelValues.region
              ? (multiLevelValues.region as string)
              : '',
            year: multiLevelValues.year
              ? (multiLevelValues.year as string)
              : '',
            platform: multiLevelValues.platform
              ? (multiLevelValues.platform as string)
              : '',
            sort: multiLevelValues.sort
              ? (multiLevelValues.sort as string)
              : '',
            label: multiLevelValues.label
              ? (multiLevelValues.label as string)
              : '',
          });
        } else {
          data = await getDoubanCategories(getRequestParams(currentPage * 25));
        }

        if (data.code === 200) {
          const currentSnapshot = { ...currentParamsRef.current };

          if (isSnapshotEqual(requestSnapshot, currentSnapshot)) {
            setDoubanData((prev) => [...prev, ...data.list]);
            setHasMore(data.list.length !== 0);
          } else {
            console.log('参数不一致，不执行任何操作，避免设置过期数据');
          }
        } else {
          throw new Error(data.message || '获取数据失败');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingMore(false);
      }
    };

    fetchMoreData();
  }, [
    currentPage,
    type,
    primarySelection,
    secondarySelection,
    multiLevelValues,
    getRequestParams,
    isSnapshotEqual,
  ]);

  useEffect(() => {
    if (!hasMore || isLoadingMore || loading) {
      return;
    }

    if (!loadingRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadingRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loading]);

  const handlePrimaryChange = useCallback(
    (value: string) => {
      if (value !== primarySelection) {
        setLoading(true);
        setCurrentPage(0);
        setDoubanData([]);
        setHasMore(true);
        setIsLoadingMore(false);

        setMultiLevelValues({
          type: 'all',
          region: 'all',
          year: 'all',
          platform: 'all',
          label: 'all',
          sort: 'T',
        });

        if ((type === 'tv' || type === 'show') && value === '最近热门') {
          setPrimarySelection(value);
          if (type === 'tv') {
            setSecondarySelection('tv');
          } else if (type === 'show') {
            setSecondarySelection('show');
          }
        } else {
          setPrimarySelection(value);
        }
      }
    },
    [primarySelection, type],
  );

  const handleSecondaryChange = useCallback(
    (value: string) => {
      if (value !== secondarySelection) {
        setLoading(true);
        setCurrentPage(0);
        setDoubanData([]);
        setHasMore(true);
        setIsLoadingMore(false);
        setSecondarySelection(value);
      }
    },
    [secondarySelection],
  );

  const handleMultiLevelChange = useCallback(
    (values: Record<string, string>) => {
      const isEqual = (
        obj1: Record<string, string>,
        obj2: Record<string, string>,
      ) => {
        const keys1 = Object.keys(obj1).sort();
        const keys2 = Object.keys(obj2).sort();

        if (keys1.length !== keys2.length) return false;

        return keys1.every((key) => obj1[key] === obj2[key]);
      };

      if (isEqual(values, multiLevelValues)) {
        return;
      }

      setLoading(true);
      setCurrentPage(0);
      setDoubanData([]);
      setHasMore(true);
      setIsLoadingMore(false);
      setMultiLevelValues(values);
    },
    [multiLevelValues],
  );

  const getPageTitle = () => {
    return type === 'movie'
      ? '电影'
      : type === 'tv'
        ? '电视剧'
        : type === 'anime'
          ? '动漫'
          : type === 'short'
            ? '短剧'
          : '综艺';
  };

  const getPageDescription = () =>
    type === 'anime'
      ? '来自豆瓣的动画精选内容'
      : type === 'short'
        ? '来自豆瓣的短剧与微短剧精选内容'
        : '来自豆瓣的精选内容';

  const getActivePath = () => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);

    const queryString = params.toString();
    return `/douban${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <PageLayout activePath={getActivePath()}>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible'>
        <div className='mb-6 sm:mb-8 space-y-4 sm:space-y-6'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 dark:text-gray-200'>
              {getPageTitle()}
            </h1>
            <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400'>
              {getPageDescription()}
            </p>
          </div>

          <div className='bg-white/60 dark:bg-gray-800/40 rounded-2xl p-4 sm:p-6 border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-xs'>
            <DoubanSelector
              type={type as 'movie' | 'tv' | 'show' | 'anime' | 'short'}
              primarySelection={primarySelection}
              secondarySelection={secondarySelection}
              onPrimaryChange={handlePrimaryChange}
              onSecondaryChange={handleSecondaryChange}
              onMultiLevelChange={handleMultiLevelChange}
            />
          </div>
        </div>

        <div className='max-w-[95%] mx-auto mt-8 overflow-visible'>
          {loading || !selectorsReady ? (
            <div className='justify-start grid grid-cols-3 gap-x-2 gap-y-12 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-x-8 sm:gap-y-20'>
              {skeletonData.map((index) => (
                <DoubanCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <VirtualGrid
              items={doubanData}
              className='grid-cols-3 gap-x-2 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-x-8'
              rowGapClass='pb-12 sm:pb-20'
              estimateRowHeight={320}
              renderItem={(item, index) => (
                <div key={`${item.title}-${index}`} className='w-full'>
                  <VideoCard
                    from='douban'
                    title={item.title}
                    poster={item.poster}
                    douban_id={Number(item.id)}
                    rate={item.rate}
                    year={item.year}
                    type={type === 'movie' ? 'movie' : ''}
                  />
                </div>
              )}
            />
          )}

          {hasMore && !loading && (
            <div
              ref={(el) => {
                if (el && el.offsetParent !== null) {
                  (
                    loadingRef as React.MutableRefObject<HTMLDivElement | null>
                  ).current = el;
                }
              }}
              className='flex justify-center mt-12 py-8'
            >
              {isLoadingMore && (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-green-500'></div>
                  <span className='text-gray-600'>加载中...</span>
                </div>
              )}
            </div>
          )}

          {!hasMore && doubanData.length > 0 && (
            <div className='text-center text-gray-500 py-8'>已加载全部内容</div>
          )}

          {!loading && doubanData.length === 0 && (
            <div className='text-center text-gray-500 py-8'>暂无相关内容</div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default function DoubanPage() {
  return (
    <Suspense>
      <DoubanPageClient />
    </Suspense>
  );
}
