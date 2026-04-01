/* eslint-disable no-console */

import { db } from '@/lib/db';

import {
  type AdminConfig,
  type ConfigSubscription,
  DEFAULT_CONFIG_SUBSCRIPTION,
} from './admin.types';
import { parseConfigFile } from './config.shared';

export async function createInitialConfig(
  configFile: string,
  subConfig: ConfigSubscription = DEFAULT_CONFIG_SUBSCRIPTION,
): Promise<AdminConfig> {
  const cfgFile = parseConfigFile(configFile);
  const adminConfig: AdminConfig = {
    ConfigFile: configFile,
    ConfigSubscription: subConfig,
    SiteConfig: {
      SiteName: process.env.NEXT_PUBLIC_SITE_NAME || 'MyTV',
      Announcement:
        process.env.ANNOUNCEMENT ||
        '本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。本站不存储任何视频资源，不对任何内容的准确性、合法性、完整性负责。',
      SearchDownstreamMaxPage:
        Number(process.env.NEXT_PUBLIC_SEARCH_MAX_PAGE) || 5,
      SiteInterfaceCacheTime: cfgFile.cache_time || 7200,
      DoubanProxyType:
        process.env.NEXT_PUBLIC_DOUBAN_PROXY_TYPE || 'cmliussss-cdn-tencent',
      DoubanProxy: process.env.NEXT_PUBLIC_DOUBAN_PROXY || '',
      DoubanImageProxyType:
        process.env.NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE ||
        'cmliussss-cdn-tencent',
      DoubanImageProxy: process.env.NEXT_PUBLIC_DOUBAN_IMAGE_PROXY || '',
      DisableYellowFilter:
        process.env.NEXT_PUBLIC_DISABLE_YELLOW_FILTER === 'true',
      FluidSearch: process.env.NEXT_PUBLIC_FLUID_SEARCH !== 'false',
    },
    UserConfig: {
      Users: [],
    },
    SourceConfig: [],
  };

  let userNames: string[] = [];
  try {
    userNames = await db.getAllUsers();
  } catch (error) {
    console.error('获取用户列表失败:', error);
  }

  const users: AdminConfig['UserConfig']['Users'] = userNames
    .filter((username) => username !== process.env.USERNAME)
    .map((username) => ({
      username,
      role: 'user',
      banned: false,
    }));

  if (process.env.USERNAME) {
    users.unshift({
      username: process.env.USERNAME,
      role: 'owner',
      banned: false,
    });
  }

  adminConfig.UserConfig.Users = users;

  Object.entries(cfgFile.api_site || {}).forEach(([key, site]) => {
    adminConfig.SourceConfig.push({
      key,
      name: site.name,
      api: site.api,
      detail: site.detail,
      from: 'config',
      disabled: false,
    });
  });
  return adminConfig;
}
