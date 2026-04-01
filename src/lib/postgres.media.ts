import {
  mapJsonRecordRows,
  parseJsonColumn,
  type PostgresQuery,
} from './postgres.storage-helpers';
import { type Favorite, type PlayRecord } from './types';

export async function getPlayRecord(
  query: PostgresQuery,
  userName: string,
  key: string,
): Promise<PlayRecord | null> {
  const result = await query<{ record: PlayRecord | string }>(
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

export async function setPlayRecord(
  query: PostgresQuery,
  userName: string,
  key: string,
  record: PlayRecord,
): Promise<void> {
  await query(
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

export async function getAllPlayRecords(
  query: PostgresQuery,
  userName: string,
): Promise<Record<string, PlayRecord>> {
  const result = await query<{
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

  return mapJsonRecordRows<PlayRecord>(result.rows, 'record');
}

export async function deletePlayRecord(
  query: PostgresQuery,
  userName: string,
  key: string,
): Promise<void> {
  await query(
    `
      DELETE FROM mytv_play_records
      WHERE username = $1 AND storage_key = $2
    `,
    [userName, key],
  );
}

export async function deleteAllPlayRecords(
  query: PostgresQuery,
  userName: string,
): Promise<void> {
  await query(
    `
      DELETE FROM mytv_play_records
      WHERE username = $1
    `,
    [userName],
  );
}

export async function getFavorite(
  query: PostgresQuery,
  userName: string,
  key: string,
): Promise<Favorite | null> {
  const result = await query<{ favorite: Favorite | string }>(
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

export async function setFavorite(
  query: PostgresQuery,
  userName: string,
  key: string,
  favorite: Favorite,
): Promise<void> {
  await query(
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

export async function getAllFavorites(
  query: PostgresQuery,
  userName: string,
): Promise<Record<string, Favorite>> {
  const result = await query<{
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

  return mapJsonRecordRows<Favorite>(result.rows, 'favorite');
}

export async function deleteFavorite(
  query: PostgresQuery,
  userName: string,
  key: string,
): Promise<void> {
  await query(
    `
      DELETE FROM mytv_favorites
      WHERE username = $1 AND storage_key = $2
    `,
    [userName, key],
  );
}

export async function deleteAllFavorites(
  query: PostgresQuery,
  userName: string,
): Promise<void> {
  await query(
    `
      DELETE FROM mytv_favorites
      WHERE username = $1
    `,
    [userName],
  );
}
