import { type SearchResult } from '@/lib/types';
import { cleanHtmlTags } from '@/lib/utils';

import { type ApiSite } from './config';

export interface ApiSearchItem {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks?: string;
  vod_play_url?: string;
  vod_class?: string;
  vod_year?: string;
  vod_content?: string;
  vod_douban_id?: number;
  type_name?: string;
}

export const M3U8_PATTERN = /(https?:\/\/[^"'\s]+?\.m3u8)/g;

export const normalizeYear = (year?: string) =>
  year ? year.match(/\d{4}/)?.[0] || '' : 'unknown';

export const extractEpisodesFromVodPlayUrl = (vodPlayUrl?: string) => {
  let episodes: string[] = [];
  let titles: string[] = [];

  if (!vodPlayUrl) {
    return { episodes, titles };
  }

  vodPlayUrl.split('$$$').forEach((url: string) => {
    const matchEpisodes: string[] = [];
    const matchTitles: string[] = [];

    url.split('#').forEach((titleUrl: string) => {
      const episodeTitleUrl = titleUrl.split('$');
      if (
        episodeTitleUrl.length === 2 &&
        episodeTitleUrl[1].endsWith('.m3u8')
      ) {
        matchTitles.push(episodeTitleUrl[0]);
        matchEpisodes.push(episodeTitleUrl[1]);
      }
    });

    if (matchEpisodes.length > episodes.length) {
      episodes = matchEpisodes;
      titles = matchTitles;
    }
  });

  return { episodes, titles };
};

export const buildSearchResultFromApiItem = (
  item: ApiSearchItem,
  apiSite: ApiSite,
): SearchResult => {
  const { episodes, titles } = extractEpisodesFromVodPlayUrl(item.vod_play_url);

  return {
    id: item.vod_id.toString(),
    title: item.vod_name.trim().replace(/\s+/g, ' '),
    poster: item.vod_pic,
    episodes,
    episodes_titles: titles,
    source: apiSite.key,
    source_name: apiSite.name,
    class: item.vod_class,
    year: normalizeYear(item.vod_year),
    desc: cleanHtmlTags(item.vod_content || ''),
    type_name: item.type_name,
    douban_id: item.vod_douban_id,
  };
};

export const buildDetailResultFromApiItem = ({
  item,
  id,
  apiSite,
}: {
  item: ApiSearchItem;
  id: string;
  apiSite: ApiSite;
}): SearchResult => {
  const { episodes: splitEpisodes, titles } = extractEpisodesFromVodPlayUrl(
    item.vod_play_url,
  );
  const episodes =
    splitEpisodes.length > 0
      ? splitEpisodes
      : (item.vod_content?.match(M3U8_PATTERN) || []).map((link) =>
          link.replace(/^\$/, ''),
        );

  return {
    id: id.toString(),
    title: item.vod_name,
    poster: item.vod_pic,
    episodes,
    episodes_titles: titles,
    source: apiSite.key,
    source_name: apiSite.name,
    class: item.vod_class,
    year: normalizeYear(item.vod_year),
    desc: cleanHtmlTags(item.vod_content || ''),
    type_name: item.type_name,
    douban_id: item.vod_douban_id,
  };
};

export const buildSpecialSourceDetailResult = ({
  html,
  id,
  apiSite,
}: {
  html: string;
  id: string;
  apiSite: ApiSite;
}): SearchResult => {
  let matches: string[] = [];

  if (apiSite.key === 'ffzy') {
    const ffzyPattern =
      /\$(https?:\/\/[^"'\s]+?\/\d{8}\/\d+_[a-f0-9]+\/index\.m3u8)/g;
    matches = html.match(ffzyPattern) || [];
  }

  if (matches.length === 0) {
    const generalPattern = /\$(https?:\/\/[^"'\s]+?\.m3u8)/g;
    matches = html.match(generalPattern) || [];
  }

  matches = Array.from(new Set(matches)).map((link: string) => {
    const trimmed = link.substring(1);
    const parenIndex = trimmed.indexOf('(');
    return parenIndex > 0 ? trimmed.substring(0, parenIndex) : trimmed;
  });

  const episodesTitles = Array.from({ length: matches.length }, (_, index) =>
    (index + 1).toString(),
  );

  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const descMatch = html.match(
    /<div[^>]*class=["']sketch["'][^>]*>([\s\S]*?)<\/div>/,
  );
  const coverMatch = html.match(/(https?:\/\/[^"'\s]+?\.jpg)/g);
  const yearMatch = html.match(/>(\d{4})</);

  return {
    id,
    title: titleMatch ? titleMatch[1].trim() : '',
    poster: coverMatch ? coverMatch[0].trim() : '',
    episodes: matches,
    episodes_titles: episodesTitles,
    source: apiSite.key,
    source_name: apiSite.name,
    class: '',
    year: yearMatch ? yearMatch[1] : 'unknown',
    desc: descMatch ? cleanHtmlTags(descMatch[1]) : '',
    type_name: '',
    douban_id: 0,
  };
};
