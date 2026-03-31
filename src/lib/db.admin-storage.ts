import { type AdminConfig } from './admin.types';
import { type IStorage } from './types';

export async function getAdminConfig(
  storage: IStorage,
): Promise<AdminConfig | null> {
  return storage.getAdminConfig();
}

export async function saveAdminConfig(
  storage: IStorage,
  config: AdminConfig,
): Promise<void> {
  await storage.setAdminConfig(config);
}

export async function clearAllData(storage: IStorage): Promise<void> {
  await storage.clearAllData();
}
