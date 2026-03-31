import { type AdminConfig } from './admin.types';
import { parseConfigFile, type ApiSite } from './config.shared';

const mapSourceToApiSite = (
  source: AdminConfig['SourceConfig'][number],
): ApiSite => ({
  key: source.key,
  name: source.name,
  api: source.api,
  detail: source.detail,
});

export function refineConfig(adminConfig: AdminConfig): AdminConfig {
  const fileConfig = parseConfigFile(adminConfig.ConfigFile);

  const apiSitesFromFile = Object.entries(fileConfig.api_site || {});
  const currentApiSites = new Map(
    (adminConfig.SourceConfig || []).map((source) => [source.key, source]),
  );

  apiSitesFromFile.forEach(([key, site]) => {
    const existingSource = currentApiSites.get(key);
    if (existingSource) {
      existingSource.name = site.name;
      existingSource.api = site.api;
      existingSource.detail = site.detail;
      existingSource.from = 'config';
      return;
    }

    currentApiSites.set(key, {
      key,
      name: site.name,
      api: site.api,
      detail: site.detail,
      from: 'config',
      disabled: false,
    });
  });

  const apiSitesFromFileKey = new Set(apiSitesFromFile.map(([key]) => key));
  currentApiSites.forEach((source) => {
    if (!apiSitesFromFileKey.has(source.key)) {
      source.from = 'custom';
    }
  });
  adminConfig.SourceConfig = Array.from(currentApiSites.values());

  const customCategoriesFromFile = fileConfig.custom_category || [];
  const currentCustomCategories = new Map(
    (adminConfig.CustomCategories || []).map((category) => [
      category.query + category.type,
      category,
    ]),
  );

  customCategoriesFromFile.forEach((category) => {
    const key = category.query + category.type;
    const existedCategory = currentCustomCategories.get(key);
    if (existedCategory) {
      existedCategory.name = category.name;
      existedCategory.query = category.query;
      existedCategory.type = category.type;
      existedCategory.from = 'config';
      return;
    }

    currentCustomCategories.set(key, {
      name: category.name,
      type: category.type,
      query: category.query,
      from: 'config',
      disabled: false,
    });
  });

  const customCategoriesFromFileKeys = new Set(
    customCategoriesFromFile.map((category) => category.query + category.type),
  );
  currentCustomCategories.forEach((category) => {
    if (!customCategoriesFromFileKeys.has(category.query + category.type)) {
      category.from = 'custom';
    }
  });
  adminConfig.CustomCategories = Array.from(currentCustomCategories.values());

  return adminConfig;
}

export function configSelfCheck(adminConfig: AdminConfig): AdminConfig {
  if (!adminConfig.UserConfig) {
    adminConfig.UserConfig = { Users: [] };
  }
  if (
    !adminConfig.UserConfig.Users ||
    !Array.isArray(adminConfig.UserConfig.Users)
  ) {
    adminConfig.UserConfig.Users = [];
  }
  if (!adminConfig.SourceConfig || !Array.isArray(adminConfig.SourceConfig)) {
    adminConfig.SourceConfig = [];
  }
  if (
    !adminConfig.CustomCategories ||
    !Array.isArray(adminConfig.CustomCategories)
  ) {
    adminConfig.CustomCategories = [];
  }

  const ownerUser = process.env.USERNAME;

  const seenUsernames = new Set<string>();
  adminConfig.UserConfig.Users = adminConfig.UserConfig.Users.filter((user) => {
    if (seenUsernames.has(user.username)) {
      return false;
    }
    seenUsernames.add(user.username);
    return true;
  });

  const originOwnerCfg = adminConfig.UserConfig.Users.find(
    (user) => user.username === ownerUser,
  );
  adminConfig.UserConfig.Users = adminConfig.UserConfig.Users.filter(
    (user) => user.username !== ownerUser,
  );
  adminConfig.UserConfig.Users.forEach((user) => {
    if (user.role === 'owner') {
      user.role = 'user';
    }
  });
  if (ownerUser) {
    adminConfig.UserConfig.Users.unshift({
      username: ownerUser,
      role: 'owner',
      banned: false,
      enabledApis: originOwnerCfg?.enabledApis || undefined,
      tags: originOwnerCfg?.tags || undefined,
    });
  }

  const seenSourceKeys = new Set<string>();
  adminConfig.SourceConfig = adminConfig.SourceConfig.filter((source) => {
    if (seenSourceKeys.has(source.key)) {
      return false;
    }
    seenSourceKeys.add(source.key);
    return true;
  });

  const seenCustomCategoryKeys = new Set<string>();
  adminConfig.CustomCategories = adminConfig.CustomCategories.filter(
    (category) => {
      const key = category.query + category.type;
      if (seenCustomCategoryKeys.has(key)) {
        return false;
      }
      seenCustomCategoryKeys.add(key);
      return true;
    },
  );

  return adminConfig;
}

export function resolveAvailableApiSites(
  adminConfig: AdminConfig,
  user?: string,
): ApiSite[] {
  const allApiSites = adminConfig.SourceConfig.filter((source) => !source.disabled);

  if (!user) {
    return allApiSites.map(mapSourceToApiSite);
  }

  const userConfig = adminConfig.UserConfig.Users.find(
    (item) => item.username === user,
  );
  if (!userConfig) {
    return allApiSites.map(mapSourceToApiSite);
  }

  if (userConfig.enabledApis && userConfig.enabledApis.length > 0) {
    const userApiSitesSet = new Set(userConfig.enabledApis);
    return allApiSites
      .filter((source) => userApiSitesSet.has(source.key))
      .map(mapSourceToApiSite);
  }

  if (userConfig.tags && userConfig.tags.length > 0 && adminConfig.UserConfig.Tags) {
    const enabledApisFromTags = new Set<string>();

    userConfig.tags.forEach((tagName) => {
      const tagConfig = adminConfig.UserConfig.Tags?.find(
        (tag) => tag.name === tagName,
      );
      if (tagConfig?.enabledApis) {
        tagConfig.enabledApis.forEach((apiKey) =>
          enabledApisFromTags.add(apiKey),
        );
      }
    });

    if (enabledApisFromTags.size > 0) {
      return allApiSites
        .filter((source) => enabledApisFromTags.has(source.key))
        .map(mapSourceToApiSite);
    }
  }

  return allApiSites.map(mapSourceToApiSite);
}
