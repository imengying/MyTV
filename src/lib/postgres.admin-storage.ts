import { type Pool } from 'pg';

import { type AdminConfig } from './admin.types';
import { ensureOwnerUser } from './postgres.core';
import { parseJsonColumn, type PostgresQuery } from './postgres.storage-helpers';

export async function getAdminConfig(
  query: PostgresQuery,
): Promise<AdminConfig | null> {
  const result = await query<{ config: AdminConfig | string }>(
    `
      SELECT config
      FROM mytv_admin_configs
      WHERE config_key = 'default'
    `,
  );

  const row = result.rows[0];
  return row ? parseJsonColumn<AdminConfig>(row.config) : null;
}

export async function setAdminConfig(
  query: PostgresQuery,
  config: AdminConfig,
): Promise<void> {
  await query(
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

export async function clearAllData(
  query: PostgresQuery,
  pool: Pool,
): Promise<void> {
  await query(
    `
      TRUNCATE TABLE
        mytv_admin_configs,
        mytv_search_history,
        mytv_favorites,
        mytv_play_records,
        mytv_users
      RESTART IDENTITY CASCADE
    `,
  );

  await ensureOwnerUser(pool);
}
