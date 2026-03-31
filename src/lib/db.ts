import { type AdminConfig } from './admin.types';
import * as dbAdminStorage from './db.admin-storage';
import { getStorage } from './db.core';
import * as dbMedia from './db.media';
import * as dbUsers from './db.users';
import { type Favorite, type PlayRecord } from './types';

export { generateStorageKey } from './db.core';

export class DbManager {
  private storage = getStorage();

  async getPlayRecord(
    userName: string,
    source: string,
    id: string,
  ): Promise<PlayRecord | null> {
    return dbMedia.getPlayRecord(this.storage, userName, source, id);
  }

  async savePlayRecord(
    userName: string,
    source: string,
    id: string,
    record: PlayRecord,
  ): Promise<void> {
    await dbMedia.savePlayRecord(this.storage, userName, source, id, record);
  }

  async getAllPlayRecords(userName: string): Promise<Record<string, PlayRecord>> {
    return dbMedia.getAllPlayRecords(this.storage, userName);
  }

  async deletePlayRecord(
    userName: string,
    source: string,
    id: string,
  ): Promise<void> {
    await dbMedia.deletePlayRecord(this.storage, userName, source, id);
  }

  async deleteAllPlayRecords(userName: string): Promise<void> {
    await dbMedia.deleteAllPlayRecords(this.storage, userName);
  }

  async getFavorite(
    userName: string,
    source: string,
    id: string,
  ): Promise<Favorite | null> {
    return dbMedia.getFavorite(this.storage, userName, source, id);
  }

  async saveFavorite(
    userName: string,
    source: string,
    id: string,
    favorite: Favorite,
  ): Promise<void> {
    await dbMedia.saveFavorite(this.storage, userName, source, id, favorite);
  }

  async getAllFavorites(userName: string): Promise<Record<string, Favorite>> {
    return dbMedia.getAllFavorites(this.storage, userName);
  }

  async deleteFavorite(
    userName: string,
    source: string,
    id: string,
  ): Promise<void> {
    await dbMedia.deleteFavorite(this.storage, userName, source, id);
  }

  async deleteAllFavorites(userName: string): Promise<void> {
    await dbMedia.deleteAllFavorites(this.storage, userName);
  }

  async isFavorited(
    userName: string,
    source: string,
    id: string,
  ): Promise<boolean> {
    return dbMedia.isFavorited(this.storage, userName, source, id);
  }

  async registerUser(userName: string, password: string): Promise<void> {
    await dbUsers.registerUser(this.storage, userName, password);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    return dbUsers.verifyUser(this.storage, userName, password);
  }

  async checkUserExist(userName: string): Promise<boolean> {
    return dbUsers.checkUserExist(this.storage, userName);
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    await dbUsers.changePassword(this.storage, userName, newPassword);
  }

  async deleteUser(userName: string): Promise<void> {
    await dbUsers.deleteUser(this.storage, userName);
  }

  async getSearchHistory(userName: string): Promise<string[]> {
    return dbUsers.getSearchHistory(this.storage, userName);
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    await dbUsers.addSearchHistory(this.storage, userName, keyword);
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    await dbUsers.deleteSearchHistory(this.storage, userName, keyword);
  }

  async getAllUsers(): Promise<string[]> {
    return dbUsers.getAllUsers(this.storage);
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    return dbAdminStorage.getAdminConfig(this.storage);
  }

  async saveAdminConfig(config: AdminConfig): Promise<void> {
    await dbAdminStorage.saveAdminConfig(this.storage, config);
  }

  async clearAllData(): Promise<void> {
    await dbAdminStorage.clearAllData(this.storage);
  }
}

export const db = new DbManager();
