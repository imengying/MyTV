export interface ApiSite {
  key: string;
  api: string;
  name: string;
  detail?: string;
}

export interface ConfigFileStruct {
  cache_time?: number;
  api_site?: Record<string, Omit<ApiSite, 'key'>>;
}

export const API_CONFIG = {
  search: {
    path: '?ac=videolist&wd=',
    pagePath: '?ac=videolist&wd={query}&pg={page}',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  },
  detail: {
    path: '?ac=videolist&ids=',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  },
};

export const parseConfigFile = (configFile: string): ConfigFileStruct => {
  try {
    return JSON.parse(configFile) as ConfigFileStruct;
  } catch {
    return {};
  }
};
