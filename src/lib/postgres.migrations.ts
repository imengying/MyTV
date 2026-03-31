/* eslint-disable no-console */

import { type Pool } from 'pg';

type PostgresMigration = {
  id: string;
  name: string;
  statements: string[];
};

const MIGRATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS mytv_schema_migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const MIGRATIONS: PostgresMigration[] = [
  {
    id: '20260331_rename_config_subscription',
    name: 'rename ConfigSubscribtion to ConfigSubscription',
    statements: [
      `
      UPDATE mytv_admin_configs
      SET config = jsonb_set(
        config - 'ConfigSubscribtion',
        '{ConfigSubscription}',
        config->'ConfigSubscribtion',
        true
      )
      WHERE config ? 'ConfigSubscribtion'
        AND NOT config ? 'ConfigSubscription'
      `,
    ],
  },
];

export async function runPostgresMigrations(pool: Pool): Promise<void> {
  await pool.query(MIGRATION_TABLE_SQL);

  const appliedResult = await pool.query<{ id: string }>(
    `
      SELECT id
      FROM mytv_schema_migrations
    `,
  );
  const appliedIds = new Set(appliedResult.rows.map((row) => row.id));

  for (const migration of MIGRATIONS) {
    if (appliedIds.has(migration.id)) {
      continue;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const statement of migration.statements) {
        await client.query(statement);
      }

      await client.query(
        `
          INSERT INTO mytv_schema_migrations (id, name)
          VALUES ($1, $2)
        `,
        [migration.id, migration.name],
      );

      await client.query('COMMIT');
      console.log(`Applied PostgreSQL migration: ${migration.id}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
