'use client';

import type { MutableRefObject } from 'react';

import type { SearchResult } from '@/lib/types';

type VideoElementWithHls = HTMLVideoElement & {
  hls?: any;
};

export interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
}

export const ensureVideoSource = (
  video: HTMLVideoElement | null,
  url: string,
) => {
  if (!video || !url) return;
  const sources = Array.from(video.getElementsByTagName('source'));
  const existed = sources.some((s) => s.src === url);
  if (!existed) {
    sources.forEach((s) => s.remove());
    const sourceEl = document.createElement('source');
    sourceEl.src = url;
    video.appendChild(sourceEl);
  }

  video.disableRemotePlayback = false;
  if (video.hasAttribute('disableRemotePlayback')) {
    video.removeAttribute('disableRemotePlayback');
  }
};

export const requestWakeLock = async (
  wakeLockRef: MutableRefObject<WakeLockSentinel | null>,
) => {
  try {
    if ('wakeLock' in navigator) {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      console.log('Wake Lock 已启用');
    }
  } catch (err) {
    console.warn('Wake Lock 请求失败:', err);
  }
};

export const releaseWakeLock = async (
  wakeLockRef: MutableRefObject<WakeLockSentinel | null>,
) => {
  try {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake Lock 已释放');
    }
  } catch (err) {
    console.warn('Wake Lock 释放失败:', err);
  }
};

export const cleanupPlayer = (artPlayerRef: MutableRefObject<any>) => {
  if (artPlayerRef.current) {
    try {
      if (artPlayerRef.current.video && artPlayerRef.current.video.hls) {
        artPlayerRef.current.video.hls.destroy();
      }

      artPlayerRef.current.destroy();
      artPlayerRef.current = null;

      console.log('播放器资源已清理');
    } catch (err) {
      console.warn('清理播放器资源时出错:', err);
      artPlayerRef.current = null;
    }
  }
};

export const filterAdsFromM3U8 = (m3u8Content: string): string => {
  if (!m3u8Content) return '';
  return m3u8Content
    .split('\n')
    .filter((line) => !line.includes('#EXT-X-DISCONTINUITY'))
    .join('\n');
};

export const createCustomHlsJsLoader = (Hls: any) => {
  return class CustomHlsJsLoader extends Hls.DefaultConfig.loader {
    constructor(config: any) {
      super(config);
      const load = this.load.bind(this);
      this.load = function (context: any, config: any, callbacks: any) {
        if (
          (context as any).type === 'manifest' ||
          (context as any).type === 'level'
        ) {
          const onSuccess = callbacks.onSuccess;
          callbacks.onSuccess = function (
            response: any,
            stats: any,
            context: any,
          ) {
            if (response.data && typeof response.data === 'string') {
              response.data = filterAdsFromM3U8(response.data);
            }
            return onSuccess(response, stats, context, null);
          };
        }

        load(context, config, callbacks);
      };
    }
  };
};

interface SwitchExistingPlayerOptions {
  artPlayerRef: MutableRefObject<any>;
  videoUrl: string;
  videoTitle: string;
  currentEpisodeIndex: number;
  videoCover: string;
}

export const switchExistingPlayer = ({
  artPlayerRef,
  videoUrl,
  videoTitle,
  currentEpisodeIndex,
  videoCover,
}: SwitchExistingPlayerOptions) => {
  artPlayerRef.current.switch = videoUrl;
  artPlayerRef.current.title = `${videoTitle} - 第${currentEpisodeIndex + 1}集`;
  artPlayerRef.current.poster = videoCover;
  if (artPlayerRef.current?.video) {
    ensureVideoSource(
      artPlayerRef.current.video as HTMLVideoElement,
      videoUrl,
    );
  }
};

interface InitializeArtPlayerOptions {
  Artplayer: typeof import('artplayer').default;
  Hls: typeof import('hls.js').default;
  artRef: MutableRefObject<HTMLDivElement | null>;
  artPlayerRef: MutableRefObject<any>;
  videoUrl: string;
  videoCover: string;
  videoTitle: string;
  currentEpisodeIndex: number;
  isWebkit: boolean;
  handleNextEpisode: () => void;
  saveCurrentPlayProgress: () => void | Promise<void>;
  resumeTimeRef: MutableRefObject<number | null>;
  lastVolumeRef: MutableRefObject<number>;
  lastPlaybackRateRef: MutableRefObject<number>;
  lastSaveTimeRef: MutableRefObject<number>;
  detailRef: MutableRefObject<SearchResult | null>;
  currentEpisodeIndexRef: MutableRefObject<number>;
  setCurrentEpisodeIndex: (index: number) => void;
  setIsVideoLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
  requestWakeLock: () => void | Promise<void>;
  releaseWakeLock: () => void | Promise<void>;
}

export const initializeArtPlayer = ({
  Artplayer,
  Hls,
  artRef,
  artPlayerRef,
  videoUrl,
  videoCover,
  videoTitle,
  currentEpisodeIndex,
  isWebkit,
  handleNextEpisode,
  saveCurrentPlayProgress,
  resumeTimeRef,
  lastVolumeRef,
  lastPlaybackRateRef,
  lastSaveTimeRef,
  detailRef,
  currentEpisodeIndexRef,
  setCurrentEpisodeIndex,
  setIsVideoLoading,
  setError,
  requestWakeLock,
  releaseWakeLock,
}: InitializeArtPlayerOptions) => {
  Artplayer.PLAYBACK_RATE = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  Artplayer.USE_RAF = false;
  Artplayer.FULLSCREEN_WEB_IN_BODY = true;

  const CustomHlsJsLoader = createCustomHlsJsLoader(Hls);

  artPlayerRef.current = new Artplayer({
    container: artRef.current!,
    url: videoUrl,
    poster: videoCover,
    volume: 0.7,
    isLive: false,
    muted: false,
    autoplay: true,
    pip: true,
    autoSize: false,
    autoMini: false,
    screenshot: false,
    setting: true,
    loop: false,
    flip: false,
    playbackRate: true,
    aspectRatio: false,
    fullscreen: true,
    fullscreenWeb: true,
    subtitleOffset: false,
    miniProgressBar: false,
    mutex: true,
    playsInline: true,
    autoPlayback: false,
    airplay: true,
    theme: '#22c55e',
    lang: 'zh-cn',
    hotkey: false,
    fastForward: true,
    autoOrientation: true,
    lock: true,
    moreVideoAttr: {
      crossOrigin: 'anonymous',
    },
    customType: {
      m3u8: function (video: HTMLVideoElement, url: string) {
        if (!Hls) {
          console.error('HLS.js 未加载');
          return;
        }

        const videoWithHls = video as VideoElementWithHls;
        if (videoWithHls.hls) {
          videoWithHls.hls.destroy();
        }

        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          backBufferLength: 30,
          maxBufferSize: 60 * 1000 * 1000,
          loader: CustomHlsJsLoader as typeof Hls.DefaultConfig.loader,
        });

        hls.loadSource(url);
        hls.attachMedia(video);
        videoWithHls.hls = hls;

        ensureVideoSource(video, url);

        hls.on(Hls.Events.ERROR, function (event: any, data: any) {
          console.error('HLS Error:', event, data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('网络错误，尝试恢复...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('媒体错误，尝试恢复...');
                hls.recoverMediaError();
                break;
              default:
                console.log('无法恢复的错误');
                hls.destroy();
                break;
            }
          }
        });
      },
    },
    icons: {
      loading:
        '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBkPSJNMjUuMjUxIDYuNDYxYy0xMC4zMTggMC0xOC42ODMgOC4zNjUtMTguNjgzIDE4LjY4M2g0LjA2OGMwLTguMDcgNi41NDUtMTQuNjE1IDE0LjYxNS0xNC42MTVWNi40NjF6IiBmaWxsPSIjMDA5Njg4Ij48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIGF0dHJpYnV0ZVR5cGU9IlhNTCIgZHVyPSIxcyIgZnJvbT0iMCAyNSAyNSIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHRvPSMzNjAgMjUgMjUiIHR5cGU9InJvdGF0ZSIvPjwvcGF0aD48L3N2Zz4=',
    },
    controls: [
      {
        position: 'left',
        index: 13,
        html: '<i class="art-icon flex"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/></svg></i>',
        tooltip: '播放下一集',
        click: function () {
          handleNextEpisode();
        },
      },
    ],
  });

  artPlayerRef.current.on('ready', () => {
    setError(null);
    if (artPlayerRef.current && !artPlayerRef.current.paused) {
      requestWakeLock();
    }
  });

  artPlayerRef.current.on('play', () => {
    requestWakeLock();
  });

  artPlayerRef.current.on('pause', () => {
    releaseWakeLock();
    saveCurrentPlayProgress();
  });

  artPlayerRef.current.on('video:ended', () => {
    releaseWakeLock();
  });

  if (artPlayerRef.current && !artPlayerRef.current.paused) {
    requestWakeLock();
  }

  artPlayerRef.current.on('video:volumechange', () => {
    lastVolumeRef.current = artPlayerRef.current.volume;
  });

  artPlayerRef.current.on('video:ratechange', () => {
    lastPlaybackRateRef.current = artPlayerRef.current.playbackRate;
  });

  artPlayerRef.current.on('video:canplay', () => {
    if (resumeTimeRef.current && resumeTimeRef.current > 0) {
      try {
        const duration = artPlayerRef.current.duration || 0;
        let target = resumeTimeRef.current;
        if (duration && target >= duration - 2) {
          target = Math.max(0, duration - 5);
        }
        artPlayerRef.current.currentTime = target;
        console.log('成功恢复播放进度到:', resumeTimeRef.current);
      } catch (err) {
        console.warn('恢复播放进度失败:', err);
      }
    }
    resumeTimeRef.current = null;

    setTimeout(() => {
      if (Math.abs(artPlayerRef.current.volume - lastVolumeRef.current) > 0.01) {
        artPlayerRef.current.volume = lastVolumeRef.current;
      }
      if (
        Math.abs(
          artPlayerRef.current.playbackRate - lastPlaybackRateRef.current,
        ) > 0.01 &&
        isWebkit
      ) {
        artPlayerRef.current.playbackRate = lastPlaybackRateRef.current;
      }
      artPlayerRef.current.notice.show = '';
    }, 0);

    setIsVideoLoading(false);
  });

  artPlayerRef.current.on('error', (err: any) => {
    console.error('播放器错误:', err);
    if (artPlayerRef.current.currentTime > 0) {
      return;
    }
  });

  artPlayerRef.current.on('video:ended', () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx < d.episodes.length - 1) {
      setTimeout(() => {
        setCurrentEpisodeIndex(idx + 1);
      }, 1000);
    }
  });

  artPlayerRef.current.on('video:timeupdate', () => {
    const now = Date.now();
    const interval = 5000;
    if (now - lastSaveTimeRef.current > interval) {
      saveCurrentPlayProgress();
      lastSaveTimeRef.current = now;
    }
  });

  artPlayerRef.current.on('pause', () => {
    saveCurrentPlayProgress();
  });

  if (artPlayerRef.current?.video) {
    ensureVideoSource(
      artPlayerRef.current.video as HTMLVideoElement,
      videoUrl,
    );
  }
};
