'use client';

import { Heart } from 'lucide-react';
import { type RefObject } from 'react';

import { type SearchResult } from '@/lib/types';
import { isDoubanImageUrl, processImageUrl } from '@/lib/utils';

import EpisodeSelector from '@/components/EpisodeSelector';
import PageLayout from '@/components/PageLayout';

interface PlayLoadingStateProps {
  loadingStage: 'searching' | 'preferring' | 'fetching' | 'ready';
  loadingMessage: string;
}

export const PlayLoadingState = ({
  loadingStage,
  loadingMessage,
}: PlayLoadingStateProps) => {
  return (
    <PageLayout activePath='/play'>
      <div className='flex items-center justify-center min-h-screen bg-transparent'>
        <div className='text-center max-w-md mx-auto px-6'>
          <div className='relative mb-8'>
            <div className='relative mx-auto w-24 h-24 bg-linear-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300'>
              <div className='text-white text-4xl'>
                {loadingStage === 'searching' && '🔍'}
                {loadingStage === 'preferring' && '⚡'}
                {loadingStage === 'fetching' && '🎬'}
                {loadingStage === 'ready' && '✨'}
              </div>
              <div className='absolute -inset-2 bg-linear-to-r from-green-500 to-emerald-600 rounded-2xl opacity-20 animate-spin'></div>
            </div>

            <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
              <div className='absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-bounce'></div>
              <div
                className='absolute top-4 right-4 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce'
                style={{ animationDelay: '0.5s' }}
              ></div>
              <div
                className='absolute bottom-3 left-6 w-1 h-1 bg-lime-400 rounded-full animate-bounce'
                style={{ animationDelay: '1s' }}
              ></div>
            </div>
          </div>

          <div className='mb-6 w-80 mx-auto'>
            <div className='flex justify-center space-x-2 mb-4'>
              <div
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  loadingStage === 'searching' || loadingStage === 'fetching'
                    ? 'bg-green-500 scale-125'
                    : loadingStage === 'preferring' || loadingStage === 'ready'
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                }`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  loadingStage === 'preferring'
                    ? 'bg-green-500 scale-125'
                    : loadingStage === 'ready'
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                }`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  loadingStage === 'ready'
                    ? 'bg-green-500 scale-125'
                    : 'bg-gray-300'
                }`}
              ></div>
            </div>

            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'>
              <div
                className='h-full bg-linear-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out'
                style={{
                  width:
                    loadingStage === 'searching' || loadingStage === 'fetching'
                      ? '33%'
                      : loadingStage === 'preferring'
                        ? '66%'
                        : '100%',
                }}
              ></div>
            </div>
          </div>

          <div className='space-y-2'>
            <p className='text-xl font-semibold text-gray-800 dark:text-gray-200 animate-pulse'>
              {loadingMessage}
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

interface PlayErrorStateProps {
  error: string;
  videoTitle: string;
  onBack: () => void;
  onRetry: () => void;
}

export const PlayErrorState = ({
  error,
  videoTitle,
  onBack,
  onRetry,
}: PlayErrorStateProps) => {
  return (
    <PageLayout activePath='/play'>
      <div className='flex items-center justify-center min-h-screen bg-transparent'>
        <div className='text-center max-w-md mx-auto px-6'>
          <div className='relative mb-8'>
            <div className='relative mx-auto w-24 h-24 bg-linear-to-r from-red-500 to-orange-500 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300'>
              <div className='text-white text-4xl'>😵</div>
              <div className='absolute -inset-2 bg-linear-to-r from-red-500 to-orange-500 rounded-2xl opacity-20 animate-pulse'></div>
            </div>

            <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
              <div className='absolute top-2 left-2 w-2 h-2 bg-red-400 rounded-full animate-bounce'></div>
              <div
                className='absolute top-4 right-4 w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce'
                style={{ animationDelay: '0.5s' }}
              ></div>
              <div
                className='absolute bottom-3 left-6 w-1 h-1 bg-yellow-400 rounded-full animate-bounce'
                style={{ animationDelay: '1s' }}
              ></div>
            </div>
          </div>

          <div className='space-y-4 mb-8'>
            <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
              哎呀，出现了一些问题
            </h2>
            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
              <p className='text-red-600 dark:text-red-400 font-medium'>
                {error}
              </p>
            </div>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              请检查网络连接或尝试刷新页面
            </p>
          </div>

          <div className='space-y-3'>
            <button
              onClick={onBack}
              className='w-full px-6 py-3 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl'
            >
              {videoTitle ? '🔍 返回搜索' : '← 返回上页'}
            </button>

            <button
              onClick={onRetry}
              className='w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200'
            >
              🔄 重新尝试
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

interface PlayerLoadingOverlayProps {
  isVisible: boolean;
  stage: 'initing' | 'sourceChanging';
}

export const PlayerLoadingOverlay = ({
  isVisible,
  stage,
}: PlayerLoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className='absolute inset-0 bg-black/85 backdrop-blur-xs rounded-xl flex items-center justify-center z-500 transition-all duration-300'>
      <div className='text-center max-w-md mx-auto px-6'>
        <div className='relative mb-8'>
          <div className='relative mx-auto w-24 h-24 bg-linear-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300'>
            <div className='text-white text-4xl'>🎬</div>
            <div className='absolute -inset-2 bg-linear-to-r from-green-500 to-emerald-600 rounded-2xl opacity-20 animate-spin'></div>
          </div>

          <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
            <div className='absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-bounce'></div>
            <div
              className='absolute top-4 right-4 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce'
              style={{ animationDelay: '0.5s' }}
            ></div>
            <div
              className='absolute bottom-3 left-6 w-1 h-1 bg-lime-400 rounded-full animate-bounce'
              style={{ animationDelay: '1s' }}
            ></div>
          </div>
        </div>

        <div className='space-y-2'>
          <p className='text-xl font-semibold text-white animate-pulse'>
            {stage === 'sourceChanging' ? '🔄 切换播放源...' : '🔄 视频加载中...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const FavoriteIcon = ({ filled }: { filled: boolean }) => {
  if (filled) {
    return (
      <svg
        className='h-7 w-7'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
          fill='#ef4444'
          stroke='#ef4444'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    );
  }

  return (
    <Heart className='h-7 w-7 stroke-1 text-gray-600 dark:text-gray-300' />
  );
};

interface PlayDetailsSectionProps {
  videoTitle: string;
  detail: SearchResult | null;
  favorited: boolean;
  onToggleFavorite: () => void;
  videoCover: string;
  videoDoubanId: number;
  videoYear: string;
}

export const PlayDetailsSection = ({
  videoTitle,
  detail,
  favorited,
  onToggleFavorite,
  videoCover,
  videoDoubanId,
  videoYear,
}: PlayDetailsSectionProps) => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
      <div className='md:col-span-3'>
        <div className='p-6 flex flex-col min-h-0'>
          <h1 className='text-3xl font-bold mb-2 tracking-wide flex items-center shrink-0 text-center md:text-left w-full text-gray-900 dark:text-gray-100'>
            {videoTitle || '影片标题'}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className='ml-3 shrink-0 hover:opacity-80 transition-opacity'
            >
              <FavoriteIcon filled={favorited} />
            </button>
          </h1>

          <div className='flex flex-wrap items-center gap-3 text-base mb-4 text-gray-600 dark:text-gray-300 shrink-0'>
            {detail?.class && (
              <span className='text-green-600 font-semibold'>{detail.class}</span>
            )}
            {(detail?.year || videoYear) && <span>{detail?.year || videoYear}</span>}
            {detail?.source_name && (
              <span className='border border-gray-300 dark:border-gray-500/60 px-2 py-px rounded-sm text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-transparent'>
                {detail.source_name}
              </span>
            )}
            {detail?.type_name && <span>{detail.type_name}</span>}
          </div>

          {detail?.desc && (
            <div
              className='mt-0 text-base leading-relaxed text-gray-700 dark:text-gray-300 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-hide'
              style={{ whiteSpace: 'pre-line' }}
            >
              {detail.desc}
            </div>
          )}
        </div>
      </div>

      <div className='hidden md:block md:col-span-1 md:order-first'>
        <div className='pl-0 py-4 pr-6'>
          <div className='relative bg-gray-300 dark:bg-gray-700 aspect-2/3 flex items-center justify-center rounded-xl overflow-hidden'>
            {videoCover ? (
              <>
                <img
                  src={processImageUrl(videoCover)}
                  alt={videoTitle}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.retried && isDoubanImageUrl(videoCover)) {
                      target.dataset.retried = 'true';
                      target.src = processImageUrl(videoCover, {
                        preferDirect: true,
                      });
                    }
                  }}
                />

                {videoDoubanId !== 0 && (
                  <a
                    href={`https://movie.douban.com/subject/${videoDoubanId.toString()}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='absolute top-3 left-3'
                  >
                    <div className='bg-green-500 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-green-600 hover:scale-[1.1] transition-all duration-300 ease-out'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      >
                        <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'></path>
                        <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'></path>
                      </svg>
                    </div>
                  </a>
                )}
              </>
            ) : (
              <span className='text-gray-600 dark:text-gray-400'>封面图片</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PlayPlayerSectionProps {
  videoTitle: string;
  totalEpisodes: number;
  currentEpisodeIndex: number;
  detail: SearchResult | null;
  isEpisodeSelectorCollapsed: boolean;
  onToggleEpisodeSelector: () => void;
  artRef: RefObject<HTMLDivElement | null>;
  isVideoLoading: boolean;
  videoLoadingStage: 'initing' | 'sourceChanging';
  onEpisodeChange: (episodeNumber: number) => void;
  onSourceChange: (
    newSource: string,
    newId: string,
    newTitle: string,
  ) => Promise<void>;
  currentSource: string;
  currentId: string;
  searchTitle: string;
  availableSources: SearchResult[];
  sourceSearchLoading: boolean;
  sourceSearchError: string | null;
  precomputedVideoInfo: Map<
    string,
    { quality: string; loadSpeed: string; pingTime: number }
  >;
}

export const PlayPlayerSection = ({
  videoTitle,
  totalEpisodes,
  currentEpisodeIndex,
  detail,
  isEpisodeSelectorCollapsed,
  onToggleEpisodeSelector,
  artRef,
  isVideoLoading,
  videoLoadingStage,
  onEpisodeChange,
  onSourceChange,
  currentSource,
  currentId,
  searchTitle,
  availableSources,
  sourceSearchLoading,
  sourceSearchError,
  precomputedVideoInfo,
}: PlayPlayerSectionProps) => {
  return (
    <div className='space-y-2'>
      <div className='py-1'>
        <h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
          {videoTitle || '影片标题'}
          {totalEpisodes > 1 && (
            <span className='text-gray-500 dark:text-gray-400'>
              {` > ${detail?.episodes_titles?.[currentEpisodeIndex] || `第 ${currentEpisodeIndex + 1} 集`}`}
            </span>
          )}
        </h1>
      </div>

      <div className='hidden lg:flex justify-end'>
        <button
          onClick={onToggleEpisodeSelector}
          className='group relative flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 backdrop-blur-xs border border-gray-200/50 dark:border-gray-700/50 shadow-xs hover:shadow-md transition-all duration-200'
          title={isEpisodeSelectorCollapsed ? '显示选集面板' : '隐藏选集面板'}
        >
          <svg
            className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
              isEpisodeSelectorCollapsed ? 'rotate-180' : 'rotate-0'
            }`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M9 5l7 7-7 7'
            />
          </svg>
          <span className='text-xs font-medium text-gray-600 dark:text-gray-300'>
            {isEpisodeSelectorCollapsed ? '显示' : '隐藏'}
          </span>

          <div
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full transition-all duration-200 ${
              isEpisodeSelectorCollapsed
                ? 'bg-orange-400 animate-pulse'
                : 'bg-green-400'
            }`}
          ></div>
        </button>
      </div>

      <div
        className={`grid gap-4 lg:h-[500px] xl:h-[650px] 2xl:h-[750px] transition-all duration-300 ease-in-out ${
          isEpisodeSelectorCollapsed ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4'
        }`}
      >
        <div
          className={`h-full transition-all duration-300 ease-in-out rounded-xl border border-white/0 dark:border-white/30 ${
            isEpisodeSelectorCollapsed ? 'col-span-1' : 'md:col-span-3'
          }`}
        >
          <div className='relative w-full h-[300px] lg:h-full'>
            <div
              ref={artRef}
              className='bg-black w-full h-full rounded-xl overflow-hidden shadow-lg'
            ></div>
            <PlayerLoadingOverlay
              isVisible={isVideoLoading}
              stage={videoLoadingStage}
            />
          </div>
        </div>

        <div
          className={`h-[300px] lg:h-full md:overflow-hidden transition-all duration-300 ease-in-out ${
            isEpisodeSelectorCollapsed
              ? 'md:col-span-1 lg:hidden lg:opacity-0 lg:scale-95'
              : 'md:col-span-1 lg:opacity-100 lg:scale-100'
          }`}
        >
          <EpisodeSelector
            totalEpisodes={totalEpisodes}
            episodes_titles={detail?.episodes_titles || []}
            value={currentEpisodeIndex + 1}
            onChange={onEpisodeChange}
            onSourceChange={onSourceChange}
            currentSource={currentSource}
            currentId={currentId}
            videoTitle={searchTitle || videoTitle}
            availableSources={availableSources}
            sourceSearchLoading={sourceSearchLoading}
            sourceSearchError={sourceSearchError}
            precomputedVideoInfo={precomputedVideoInfo}
          />
        </div>
      </div>
    </div>
  );
};
