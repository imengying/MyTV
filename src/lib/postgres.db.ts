import { Pool, QueryResult, QueryResultRow } from 'pg';

import { AdminConfig } from './admin.types';
import * as postgresAdminStorage from './postgres.admin-storage';
import { ensurePoolReady, getPool } from './postgres.core';
import * as postgresMedia from './postgres.media';
import * as postgresUsers from './postgres.users';
import { Favorite, IStorage, PlayRecord } from './types';

export class PostgresStorage implements IStorage {
  private pool?: Pool;

  private getPoolInstance(): Pool {
    if (!this.pool) {
      this.pool = getPool();
    }

    return this.pool;
  }

  private async ready(): Promise<void> {
    const pool = this.getPoolInstance();
    await ensurePoolReady(pool);
  }

  private async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ): Promise<QueryResult<T>> {
    await this.ready();
    return this.getPoolInstance().query<T>(text, values);
  }

  async getPlayRecord(
    userName: string,
    key: string,
  ): Promise<PlayRecord | null> {
    return postgresMedia.getPlayRecord(this.query.bind(this), userName, key);
  }

  async setPlayRecord(
    userName: string,
    key: string,
    record: PlayRecord,
  ): Promise<void> {
    return postgresMedia.setPlayRecord(this.query.bind(this), userName, key, record);
  }

  async getAllPlayRecords(
    userName: string,
  ): Promise<Record<string, PlayRecord>> {
    return postgresMedia.getAllPlayRecords(this.query.bind(this), userName);
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    return postgresMedia.deletePlayRecord(this.query.bind(this), userName, key);
  }

  async deleteAllPlayRecords(userName: string): Promise<void> {
    return postgresMedia.deleteAllPlayRecords(this.query.bind(this), userName);
  }

  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    return postgresMedia.getFavorite(this.query.bind(this), userName, key);
  }

  async setFavorite(
    userName: string,
    key: string,
    favorite: Favorite,
  ): Promise<void> {
    return postgresMedia.setFavorite(this.query.bind(this), userName, key, favorite);
  }

  async getAllFavorites(userName: string): Promise<Record<string, Favorite>> {
    return postgresMedia.getAllFavorites(this.query.bind(this), userName);
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    return postgresMedia.deleteFavorite(this.query.bind(this), userName, key);
  }

  async deleteAllFavorites(userName: string): Promise<void> {
    return postgresMedia.deleteAllFavorites(this.query.bind(this), userName);
  }

  async registerUser(userName: string, password: string): Promise<void> {
    return postgresUsers.registerUser(this.query.bind(this), userName, password);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    return postgresUsers.verifyUser(this.query.bind(this), userName, password);
  }

  async checkUserExist(userName: string): Promise<boolean> {
    return postgresUsers.checkUserExist(this.query.bind(this), userName);
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    return postgresUsers.changePassword(
      this.query.bind(this),
      userName,
      newPassword,
    );
  }

  async getStoredPassword(userName: string): Promise<string | null> {
    return postgresUsers.getStoredPassword(this.query.bind(this), userName);
  }

  async deleteUser(userName: string): Promise<void> {
    return postgresUsers.deleteUser(this.query.bind(this), userName);
  }

  async getSearchHistory(userName: string): Promise<string[]> {
    return postgresUsers.getSearchHistory(this.query.bind(this), userName);
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    return postgresUsers.addSearchHistory(this.query.bind(this), userName, keyword);
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    return postgresUsers.deleteSearchHistory(
      this.query.bind(this),
      userName,
      keyword,
    );
  }

  async getAllUsers(): Promise<string[]> {
    return postgresUsers.getAllUsers(this.query.bind(this));
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    return postgresAdminStorage.getAdminConfig(this.query.bind(this));
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    return postgresAdminStorage.setAdminConfig(this.query.bind(this), config);
  }

  async clearAllData(): Promise<void> {
    return postgresAdminStorage.clearAllData(
      this.query.bind(this),
      this.getPoolInstance(),
    );
  }
}
