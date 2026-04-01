'use client';

import { type SearchResult } from '@/lib/types';
import { getVideoResolutionFromM3u8 } from '@/lib/utils';

import { type SourceVideoInfo } from '@/features/play/source-selection.types';

const getQualityScore = (quality: string) => {
  switch (quality) {
    case '4K':
      return 100;
    case '2K':
      return 85;
    case '1080p':
      return 75;
    case '720p':
      return 60;
    case '480p':
      return 40;
    case 'SD':
      return 20;
    default:
      return 0;
  }
};

const parseSpeedToKBps = (loadSpeed: string) => {
  if (loadSpeed === '未知' || loadSpeed === '测量中...') return 0;

  const match = loadSpeed.match(/^([\d.]+)\s*(KB\/s|MB\/s)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  return match[2] === 'MB/s' ? value * 1024 : value;
};

export const calculateSourceScore = (
  testResult: SourceVideoInfo,
  maxSpeed: number,
  minPing: number,
  maxPing: number,
): number => {
  let score = 0;

  score += getQualityScore(testResult.quality) * 0.4;

  const speedKBps = parseSpeedToKBps(testResult.loadSpeed);
  const speedScore =
    speedKBps > 0 ? Math.min(100, Math.max(0, (speedKBps / maxSpeed) * 100)) : 30;
  score += speedScore * 0.4;

  const pingScore = (() => {
    const ping = testResult.pingTime;
    if (ping <= 0) return 0;
    if (maxPing === minPing) return 100;

    const pingRatio = (maxPing - ping) / (maxPing - minPing);
    return Math.min(100, Math.max(0, pingRatio * 100));
  })();
  score += pingScore * 0.2;

  return Math.round(score * 100) / 100;
};

export const preferBestSource = async (
  sources: SearchResult[],
): Promise<{
  bestSource: SearchResult;
  precomputedVideoInfo: Map<string, SourceVideoInfo>;
}> => {
  if (sources.length === 1) {
    return {
      bestSource: sources[0],
      precomputedVideoInfo: new Map(),
    };
  }

  const batchSize = Math.ceil(sources.length / 2);
  const allResults: Array<{
    source: SearchResult;
    testResult: SourceVideoInfo;
  } | null> = [];

  for (let start = 0; start < sources.length; start += batchSize) {
    const batchSources = sources.slice(start, start + batchSize);
    const batchResults = await Promise.all(
      batchSources.map(async (source) => {
        try {
          if (!source.episodes || source.episodes.length === 0) {
            return null;
          }

          const episodeUrl =
            source.episodes.length > 1 ? source.episodes[1] : source.episodes[0];
          const testResult = await getVideoResolutionFromM3u8(episodeUrl);

          return {
            source,
            testResult,
          };
        } catch {
          return null;
        }
      }),
    );
    allResults.push(...batchResults);
  }

  const newVideoInfoMap = new Map<string, SourceVideoInfo>();
  allResults.forEach((result, index) => {
    const source = sources[index];
    const sourceKey = `${source.source}-${source.id}`;
    if (result) {
      newVideoInfoMap.set(sourceKey, result.testResult);
    }
  });

  const successfulResults = allResults.filter(Boolean) as Array<{
    source: SearchResult;
    testResult: SourceVideoInfo;
  }>;

  if (successfulResults.length === 0) {
    return {
      bestSource: sources[0],
      precomputedVideoInfo: newVideoInfoMap,
    };
  }

  const validSpeeds = successfulResults
    .map((result) => parseSpeedToKBps(result.testResult.loadSpeed))
    .filter((speed) => speed > 0);

  const maxSpeed = validSpeeds.length > 0 ? Math.max(...validSpeeds) : 1024;

  const validPings = successfulResults
    .map((result) => result.testResult.pingTime)
    .filter((ping) => ping > 0);

  const minPing = validPings.length > 0 ? Math.min(...validPings) : 50;
  const maxPing = validPings.length > 0 ? Math.max(...validPings) : 1000;

  const resultsWithScore = successfulResults.map((result) => ({
    ...result,
    score: calculateSourceScore(
      result.testResult,
      maxSpeed,
      minPing,
      maxPing,
    ),
  }));

  resultsWithScore.sort((a, b) => b.score - a.score);

  return {
    bestSource: resultsWithScore[0].source,
    precomputedVideoInfo: newVideoInfoMap,
  };
};
