/* eslint-disable no-console */

import { db } from '@/lib/db';

import { type AdminConfig } from './admin.types';
import { createInitialConfig } from './config-initialization';
import {
  configSelfCheck,
  refineConfig,
  resolveAvailableApiSites,
} from './config-normalization';
import { API_CONFIG, type ApiSite } from './config.shared';

let cachedConfig: AdminConfig | undefined;

export { API_CONFIG, configSelfCheck, refineConfig };
export type { ApiSite };

export async function getConfig(): Promise<AdminConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  let adminConfig: AdminConfig | null = null;
  try {
    adminConfig = await db.getAdminConfig();
  } catch (error) {
    console.error('获取管理员配置失败:', error);
  }

  if (!adminConfig) {
    adminConfig = await createInitialConfig('');
  }

  adminConfig = configSelfCheck(adminConfig);
  cachedConfig = adminConfig;

  try {
    await db.saveAdminConfig(cachedConfig);
  } catch (error) {
    console.error('保存管理员配置失败:', error);
  }

  return cachedConfig;
}

export async function resetConfig() {
  let originConfig: AdminConfig | null = null;
  try {
    originConfig = await db.getAdminConfig();
  } catch (error) {
    console.error('获取管理员配置失败:', error);
  }

  const adminConfig = await createInitialConfig(
    originConfig?.ConfigFile || '',
    originConfig?.ConfigSubscribtion,
  );
  cachedConfig = adminConfig;
  await db.saveAdminConfig(adminConfig);
}

export async function getCacheTime(): Promise<number> {
  const config = await getConfig();
  return config.SiteConfig.SiteInterfaceCacheTime || 7200;
}

export async function getAvailableApiSites(user?: string): Promise<ApiSite[]> {
  const config = await getConfig();
  return resolveAvailableApiSites(config, user);
}

export async function setCachedConfig(config: AdminConfig) {
  cachedConfig = config;
}
