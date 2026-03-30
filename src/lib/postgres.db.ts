/* eslint-disable no-console */

import { Pool, QueryResult, QueryResultRow } from 'pg';

import { AdminConfig } from './admin.types';
import { hashPassword, isHashed, verifyPassword } from './password';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';

const SEARCH_HISTORY_LIMIT = 20;

type GlobalPostgresState = typeof globalThis & {
  __mytvPgPool?: Pool;
  __mytvPgBootstrap?: Promise<void>;
};

const globalPostgres = globalThis as GlobalPostgresState;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS mytv_users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mytv_admin_configs (
  config_key TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mytv_play_records (
  username TEXT NOT NULL REFERENCES mytv_users(username) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  record JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (username, storage_key)
);

CREATE INDEX IF NOT EXISTS idx_mytv_play_records_user_updated_at
  ON mytv_play_records (username, updated_at DESC);

CREATE TABLE IF NOT EXISTS mytv_favorites (
  username TEXT NOT NULL REFERENCES mytv_users(username) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  favorite JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (username, storage_key)
);

CREATE INDEX IF NOT EXISTS idx_mytv_favorites_user_updated_at
  ON mytv_favorites (username, updated_at DESC);

CREATE TABLE IF NOT EXISTS mytv_search_history (
  username TEXT NOT NULL REFERENCES mytv_users(username) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (username, keyword)
);

CREATE INDEX IF NOT EXISTS idx_mytv_search_history_user_updated_at
  ON mytv_search_history (username, updated_at DESC);

CREATE TABLE IF NOT EXISTS mytv_skip_configs (
  username TEXT NOT NULL REFERENCES mytv_users(username) ON DELETE CASCADE,
  source TEXT NOT NULL,
  item_id TEXT NOT NULL,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (username, source, item_id)
);
`;

function shouldUseSsl(connectionString: string): boolean {
  if (process.env.DATABASE_SSL === 'false') {
    return false;
  }

  if (connectionString.includes('sslmode=disable')) {
    return false;
  }

  return !/(localhost|127\.0\.0\.1)/.test(connectionString);
}

function getPool(): Pool {
  if (!globalPostgres.__mytvPgPool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL env variable not set');
    }

    globalPostgres.__mytvPgPool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(
        process.env.DATABASE_CONNECT_TIMEOUT_MS || 10000,
      ),
      ssl: shouldUseSsl(connectionString)
        ? { rejectUnauthorized: false }
        : undefined,
    });

    globalPostgres.__mytvPgPool.on('error', (error: Error) => {
      console.error('PostgreSQL pool error:', error);
    });
  }

  return globalPostgres.__mytvPgPool;
}

async function ensureOwnerUser(pool: Pool): Promise<void> {
  if (!process.env.USERNAME || !process.env.PASSWORD) {
    return;
  }

  const ownerPassword = isHashed(process.env.PASSWORD)
    ? process.env.PASSWORD
    : hashPassword(process.env.PASSWORD);

  await pool.query(
    `
      INSERT INTO mytv_users (username, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (username)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        updated_at = NOW()
    `,
    [process.env.USERNAME, ownerPassword],
  );
}

async function bootstrapPool(pool: Pool): Promise<void> {
  await pool.query(SCHEMA_SQL);
  await ensureOwnerUser(pool);
}

function parseJsonColumn<T>(value: T | string): T {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value;
}

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

    if (!globalPostgres.__mytvPgBootstrap) {
      globalPostgres.__mytvPgBootstrap = bootstrapPool(pool).catch((error) => {
        globalPostgres.__mytvPgBootstrap = undefined;
        throw error;
      });
    }

    await globalPostgres.__mytvPgBootstrap;
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
    const result = await this.query<{ record: PlayRecord | string }>(
      `
        SELECT record
        FROM mytv_play_records
        WHERE username = $1 AND storage_key = $2
      `,
      [userName, key],
    );

    const row = result.rows[0];
    return row ? parseJsonColumn<PlayRecord>(row.record) : null;
  }

  async setPlayRecord(
    userName: string,
    key: string,
    record: PlayRecord,
  ): Promise<void> {
    await this.query(
      `
        INSERT INTO mytv_play_records (username, storage_key, record, updated_at)
        VALUES ($1, $2, $3::jsonb, NOW())
        ON CONFLICT (username, storage_key)
        DO UPDATE SET
          record = EXCLUDED.record,
          updated_at = NOW()
      `,
      [userName, key, JSON.stringify(record)],
    );
  }

  async getAllPlayRecords(
    userName: string,
  ): Promise<Record<string, PlayRecord>> {
    const result = await this.query<{
      storage_key: string;
      record: PlayRecord | string;
    }>(
      `
        SELECT storage_key, record
        FROM mytv_play_records
        WHERE username = $1
        ORDER BY updated_at DESC
      `,
      [userName],
    );

    return result.rows.reduce<Record<string, PlayRecord>>(
      (
        acc: Record<string, PlayRecord>,
        row: { storage_key: string; record: PlayRecord | string },
      ) => {
        acc[row.storage_key] = parseJsonColumn<PlayRecord>(row.record);
        return acc;
      },
      {},
    );
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    await this.query(
      `
        DELETE FROM mytv_play_records
        WHERE username = $1 AND storage_key = $2
      `,
      [userName, key],
    );
  }

  async deleteAllPlayRecords(userName: string): Promise<void> {
    await this.query(
      `
        DELETE FROM mytv_play_records
        WHERE username = $1
      `,
      [userName],
    );
  }

  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    const result = await this.query<{ favorite: Favorite | string }>(
      `
        SELECT favorite
        FROM mytv_favorites
        WHERE username = $1 AND storage_key = $2
      `,
      [userName, key],
    );

    const row = result.rows[0];
    return row ? parseJsonColumn<Favorite>(row.favorite) : null;
  }

  async setFavorite(
    userName: string,
    key: string,
    favorite: Favorite,
  ): Promise<void> {
    await this.query(
      `
        INSERT INTO mytv_favorites (username, storage_key, favorite, updated_at)
        VALUES ($1, $2, $3::jsonb, NOW())
        ON CONFLICT (username, storage_key)
        DO UPDATE SET
          favorite = EXCLUDED.favorite,
          updated_at = NOW()
      `,
      [userName, key, JSON.stringify(favorite)],
    );
  }

  async getAllFavorites(userName: string): Promise<Record<string, Favorite>> {
    const result = await this.query<{
      storage_key: string;
      favorite: Favorite | string;
    }>(
      `
        SELECT storage_key, favorite
        FROM mytv_favorites
        WHERE username = $1
        ORDER BY updated_at DESC
      `,
      [userName],
    );

    return result.rows.reduce<Record<string, Favorite>>(
      (
        acc: Record<string, Favorite>,
        row: { storage_key: string; favorite: Favorite | string },
      ) => {
        acc[row.storage_key] = parseJsonColumn<Favorite>(row.favorite);
        return acc;
      },
      {},
    );
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    await this.query(
      `
        DELETE FROM mytv_favorites
        WHERE username = $1 AND storage_key = $2
      `,
      [userName, key],
    );
  }

  async deleteAllFavorites(userName: string): Promise<void> {
    await this.query(
      `
        DELETE FROM mytv_favorites
        WHERE username = $1
      `,
      [userName],
    );
  }

  async registerUser(userName: string, password: string): Promise<void> {
    const storedPassword = isHashed(password)
      ? password
      : hashPassword(password);

    await this.query(
      `
        INSERT INTO mytv_users (username, password_hash)
        VALUES ($1, $2)
        ON CONFLICT (username)
        DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          updated_at = NOW()
      `,
      [userName, storedPassword],
    );
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    const result = await this.query<{ password_hash: string }>(
      `
        SELECT password_hash
        FROM mytv_users
        WHERE username = $1
      `,
      [userName],
    );

    const stored = result.rows[0]?.password_hash;
    if (!stored) {
      return false;
    }

    return verifyPassword(password, stored);
  }

  async checkUserExist(userName: string): Promise<boolean> {
    const result = await this.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM mytv_users
          WHERE username = $1
        ) AS exists
      `,
      [userName],
    );

    return Boolean(result.rows[0]?.exists);
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    const storedPassword = isHashed(newPassword)
      ? newPassword
      : hashPassword(newPassword);

    await this.query(
      `
        UPDATE mytv_users
        SET password_hash = $2, updated_at = NOW()
        WHERE username = $1
      `,
      [userName, storedPassword],
    );
  }

  async getStoredPassword(userName: string): Promise<string | null> {
    const result = await this.query<{ password_hash: string }>(
      `
        SELECT password_hash
        FROM mytv_users
        WHERE username = $1
      `,
      [userName],
    );

    return result.rows[0]?.password_hash || null;
  }

  async deleteUser(userName: string): Promise<void> {
    await this.query(
      `
        DELETE FROM mytv_users
        WHERE username = $1
      `,
      [userName],
    );
  }

  async getSearchHistory(userName: string): Promise<string[]> {
    const result = await this.query<{ keyword: string }>(
      `
        SELECT keyword
        FROM mytv_search_history
        WHERE username = $1
        ORDER BY updated_at DESC
      `,
      [userName],
    );

    return result.rows.map((row: { keyword: string }) => row.keyword);
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    await this.query(
      `
        INSERT INTO mytv_search_history (username, keyword, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (username, keyword)
        DO UPDATE SET updated_at = NOW()
      `,
      [userName, keyword],
    );

    await this.query(
      `
        DELETE FROM mytv_search_history
        WHERE username = $1
          AND keyword NOT IN (
            SELECT keyword
            FROM mytv_search_history
            WHERE username = $1
            ORDER BY updated_at DESC
            LIMIT $2
          )
      `,
      [userName, SEARCH_HISTORY_LIMIT],
    );
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    if (keyword) {
      await this.query(
        `
          DELETE FROM mytv_search_history
          WHERE username = $1 AND keyword = $2
        `,
        [userName, keyword],
      );
      return;
    }

    await this.query(
      `
        DELETE FROM mytv_search_history
        WHERE username = $1
      `,
      [userName],
    );
  }

  async getAllUsers(): Promise<string[]> {
    const result = await this.query<{ username: string }>(
      `
        SELECT username
        FROM mytv_users
        ORDER BY username ASC
      `,
    );

    return result.rows.map((row: { username: string }) => row.username);
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    const result = await this.query<{ config: AdminConfig | string }>(
      `
        SELECT config
        FROM mytv_admin_configs
        WHERE config_key = 'default'
      `,
    );

    const row = result.rows[0];
    return row ? parseJsonColumn<AdminConfig>(row.config) : null;
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    await this.query(
      `
        INSERT INTO mytv_admin_configs (config_key, config, updated_at)
        VALUES ('default', $1::jsonb, NOW())
        ON CONFLICT (config_key)
        DO UPDATE SET
          config = EXCLUDED.config,
          updated_at = NOW()
      `,
      [JSON.stringify(config)],
    );
  }

  async getSkipConfig(
    userName: string,
    source: string,
    id: string,
  ): Promise<SkipConfig | null> {
    const result = await this.query<{ config: SkipConfig | string }>(
      `
        SELECT config
        FROM mytv_skip_configs
        WHERE username = $1 AND source = $2 AND item_id = $3
      `,
      [userName, source, id],
    );

    const row = result.rows[0];
    return row ? parseJsonColumn<SkipConfig>(row.config) : null;
  }

  async setSkipConfig(
    userName: string,
    source: string,
    id: string,
    config: SkipConfig,
  ): Promise<void> {
    await this.query(
      `
        INSERT INTO mytv_skip_configs (username, source, item_id, config, updated_at)
        VALUES ($1, $2, $3, $4::jsonb, NOW())
        ON CONFLICT (username, source, item_id)
        DO UPDATE SET
          config = EXCLUDED.config,
          updated_at = NOW()
      `,
      [userName, source, id, JSON.stringify(config)],
    );
  }

  async deleteSkipConfig(
    userName: string,
    source: string,
    id: string,
  ): Promise<void> {
    await this.query(
      `
        DELETE FROM mytv_skip_configs
        WHERE username = $1 AND source = $2 AND item_id = $3
      `,
      [userName, source, id],
    );
  }

  async getAllSkipConfigs(
    userName: string,
  ): Promise<{ [key: string]: SkipConfig }> {
    const result = await this.query<{
      source: string;
      item_id: string;
      config: SkipConfig | string;
    }>(
      `
        SELECT source, item_id, config
        FROM mytv_skip_configs
        WHERE username = $1
        ORDER BY updated_at DESC
      `,
      [userName],
    );

    return result.rows.reduce<Record<string, SkipConfig>>(
      (
        acc: Record<string, SkipConfig>,
        row: { source: string; item_id: string; config: SkipConfig | string },
      ) => {
        acc[`${row.source}+${row.item_id}`] = parseJsonColumn<SkipConfig>(
          row.config,
        );
        return acc;
      },
      {},
    );
  }

  async clearAllData(): Promise<void> {
    await this.query(
      `
        TRUNCATE TABLE
          mytv_admin_configs,
          mytv_skip_configs,
          mytv_search_history,
          mytv_favorites,
          mytv_play_records,
          mytv_users
        RESTART IDENTITY CASCADE
      `,
    );

    await ensureOwnerUser(this.getPoolInstance());
  }
}
