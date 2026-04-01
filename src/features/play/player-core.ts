/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { MutableRefObject } from 'react';

import type { SearchResult } from '@/lib/types';

type VideoElementWithHls = HTMLVideoElement & {
  hls?: any;
};

export interface PlaybackArtPlayer {
  video?: VideoElementWithHls;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  paused: boolean;
  fullscreen: boolean;
  title: string;
  poster: string;
  switch: string;
  notice: { show: string };
  controls?: {
    update(config: unknown): void;
  };
  destroy(): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  toggle(): void;
}

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
    }
  } catch {
  }
};

export const releaseWakeLock = async (
  wakeLockRef: MutableRefObject<WakeLockSentinel | null>,
) => {
  try {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  } catch {
  }
};

export const cleanupPlayer = (
  artPlayerRef: MutableRefObject<PlaybackArtPlayer | null>,
) => {
  if (artPlayerRef.current) {
    try {
      if (artPlayerRef.current.video && artPlayerRef.current.video.hls) {
        artPlayerRef.current.video.hls.destroy();
      }

      artPlayerRef.current.destroy();
      artPlayerRef.current = null;
    } catch {
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
  artPlayerRef: MutableRefObject<PlaybackArtPlayer | null>;
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
  const player = artPlayerRef.current;
  if (!player) return;

  player.switch = videoUrl;
  player.title = `${videoTitle} - 第${currentEpisodeIndex + 1}集`;
  player.poster = videoCover;
  if (player.video) {
    ensureVideoSource(player.video as HTMLVideoElement, videoUrl);
  }
};

interface InitializeArtPlayerOptions {
  Artplayer: typeof import('artplayer').default;
  Hls: typeof import('hls.js').default;
  artRef: MutableRefObject<HTMLDivElement | null>;
  artPlayerRef: MutableRefObject<PlaybackArtPlayer | null>;
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
  videoTitle: _videoTitle,
  currentEpisodeIndex: _currentEpisodeIndex,
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
  const playbackRates = Artplayer.PLAYBACK_RATE as number[];

  const formatPlaybackRate = (rate: number) => `${rate}x`;

  const buildPlaybackRateSelector = (currentRate: number) =>
    playbackRates.map((value) => ({
      html: formatPlaybackRate(value),
      value,
      default: Math.abs(value - currentRate) < 0.001,
    }));

  const updatePlaybackRateControl = (currentRate: number) => {
    if (!artPlayerRef.current?.controls?.update) return;

    artPlayerRef.current.controls.update({
      name: 'playback-rate',
      position: 'right',
      index: 20,
      html: formatPlaybackRate(currentRate),
      tooltip: '播放速度',
      selector: buildPlaybackRateSelector(currentRate),
      onSelect: function (selector: { value?: string | number }) {
        const selectedRate = Number(selector.value || 1);
        const player = artPlayerRef.current;
        if (!player) return;
        player.playbackRate = selectedRate;
        updatePlaybackRateControl(selectedRate);
        player.notice.show = `播放速度 ${formatPlaybackRate(selectedRate)}`;
      },
    });
  };

  const player = new Artplayer({
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
    setting: false,
    loop: false,
    flip: false,
    playbackRate: false,
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

        hls.on(Hls.Events.ERROR, function (_event: any, data: any) {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
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
        name: 'playback-rate',
        position: 'right',
        index: 20,
        html: formatPlaybackRate(lastPlaybackRateRef.current),
        tooltip: '播放速度',
        selector: buildPlaybackRateSelector(lastPlaybackRateRef.current),
        onSelect: function (selector: { value?: string | number }) {
          const selectedRate = Number(selector.value || 1);
          player.playbackRate = selectedRate;
          updatePlaybackRateControl(selectedRate);
          player.notice.show = `播放速度 ${formatPlaybackRate(selectedRate)}`;
        },
      },
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
  }) as unknown as PlaybackArtPlayer;

  artPlayerRef.current = player;

  player.on('ready', () => {
    setError(null);
    updatePlaybackRateControl(lastPlaybackRateRef.current);
    if (!player.paused) {
      requestWakeLock();
    }
  });

  player.on('play', () => {
    requestWakeLock();
  });

  player.on('pause', () => {
    releaseWakeLock();
    saveCurrentPlayProgress();
  });

  player.on('video:ended', () => {
    releaseWakeLock();
  });

  if (!player.paused) {
    requestWakeLock();
  }

  player.on('video:volumechange', () => {
    lastVolumeRef.current = player.volume;
  });

  player.on('video:ratechange', () => {
    lastPlaybackRateRef.current = player.playbackRate;
    updatePlaybackRateControl(lastPlaybackRateRef.current);
  });

  player.on('video:canplay', () => {
    if (resumeTimeRef.current && resumeTimeRef.current > 0) {
      try {
        const duration = player.duration || 0;
        let target = resumeTimeRef.current;
        if (duration && target >= duration - 2) {
          target = Math.max(0, duration - 5);
        }
        player.currentTime = target;
      } catch {
      }
    }
    resumeTimeRef.current = null;

    setTimeout(() => {
      if (Math.abs(player.volume - lastVolumeRef.current) > 0.01) {
        player.volume = lastVolumeRef.current;
      }
      if (
        Math.abs(player.playbackRate - lastPlaybackRateRef.current) > 0.01 &&
        isWebkit
      ) {
        player.playbackRate = lastPlaybackRateRef.current;
      }
      updatePlaybackRateControl(player.playbackRate);
      player.notice.show = '';
    }, 0);

    setIsVideoLoading(false);
  });

  player.on('error', (_err: any) => {
    if (player.currentTime > 0) {
      return;
    }
  });

  player.on('video:ended', () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx < d.episodes.length - 1) {
      setTimeout(() => {
        setCurrentEpisodeIndex(idx + 1);
      }, 1000);
    }
  });

  player.on('video:timeupdate', () => {
    const now = Date.now();
    const interval = 5000;
    if (now - lastSaveTimeRef.current > interval) {
      saveCurrentPlayProgress();
      lastSaveTimeRef.current = now;
    }
  });

  player.on('pause', () => {
    saveCurrentPlayProgress();
  });

  if (player.video) {
    ensureVideoSource(player.video as HTMLVideoElement, videoUrl);
  }
};
