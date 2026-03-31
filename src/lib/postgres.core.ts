/* eslint-disable no-console */

import { Pool, type PoolConfig } from 'pg';

import { hashPassword, isHashed } from './password';
import { runPostgresMigrations } from './postgres.migrations';

export const SEARCH_HISTORY_LIMIT = 20;

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

function shouldRejectUnauthorized(sslMode: string | null): boolean {
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true') {
    return true;
  }

  return sslMode === 'verify-ca' || sslMode === 'verify-full';
}

function buildPoolConfig(connectionString: string): PoolConfig {
  const defaultPoolMax = 4;
  const defaultIdleTimeoutMs = process.env.VERCEL ? 5000 : 30000;

  let sanitizedConnectionString = connectionString;
  let sslMode: string | null = null;

  try {
    const connectionUrl = new URL(connectionString);
    sslMode = connectionUrl.searchParams.get('sslmode')?.toLowerCase() || null;

    connectionUrl.searchParams.delete('sslmode');
    connectionUrl.searchParams.delete('sslcert');
    connectionUrl.searchParams.delete('sslkey');
    connectionUrl.searchParams.delete('sslrootcert');

    sanitizedConnectionString = connectionUrl.toString();
  } catch {
    // Keep original connection string as fallback.
  }

  const sslEnabled =
    sslMode === 'disable' ? false : shouldUseSsl(sanitizedConnectionString);

  return {
    connectionString: sanitizedConnectionString,
    max: Number(process.env.DATABASE_POOL_MAX || defaultPoolMax),
    idleTimeoutMillis: Number(
      process.env.DATABASE_IDLE_TIMEOUT_MS || defaultIdleTimeoutMs,
    ),
    connectionTimeoutMillis: Number(
      process.env.DATABASE_CONNECT_TIMEOUT_MS || 10000,
    ),
    ssl: sslEnabled
      ? {
          rejectUnauthorized: shouldRejectUnauthorized(sslMode),
        }
      : undefined,
  };
}

export function getPool(): Pool {
  if (!globalPostgres.__mytvPgPool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL env variable not set');
    }

    globalPostgres.__mytvPgPool = new Pool(buildPoolConfig(connectionString));
    globalPostgres.__mytvPgPool.on('error', (error: Error) => {
      console.error('PostgreSQL pool error:', error);
    });
  }

  return globalPostgres.__mytvPgPool;
}

export async function ensureOwnerUser(pool: Pool): Promise<void> {
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
  await runPostgresMigrations(pool);
  await ensureOwnerUser(pool);
}

export async function ensurePoolReady(pool: Pool): Promise<void> {
  if (!globalPostgres.__mytvPgBootstrap) {
    globalPostgres.__mytvPgBootstrap = bootstrapPool(pool).catch((error) => {
      globalPostgres.__mytvPgBootstrap = undefined;
      throw error;
    });
  }

  await globalPostgres.__mytvPgBootstrap;
}
