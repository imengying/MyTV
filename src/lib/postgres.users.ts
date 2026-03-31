import { hashPassword, isHashed, verifyPassword } from './password';
import { SEARCH_HISTORY_LIMIT } from './postgres.core';
import { type PostgresQuery } from './postgres.storage-helpers';

export async function registerUser(
  query: PostgresQuery,
  userName: string,
  password: string,
): Promise<void> {
  const storedPassword = isHashed(password) ? password : hashPassword(password);

  await query(
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

export async function verifyUser(
  query: PostgresQuery,
  userName: string,
  password: string,
): Promise<boolean> {
  const result = await query<{ password_hash: string }>(
    `
      SELECT password_hash
      FROM mytv_users
      WHERE username = $1
    `,
    [userName],
  );

  const stored = result.rows[0]?.password_hash;
  return stored ? verifyPassword(password, stored) : false;
}

export async function checkUserExist(
  query: PostgresQuery,
  userName: string,
): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
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

export async function changePassword(
  query: PostgresQuery,
  userName: string,
  newPassword: string,
): Promise<void> {
  const storedPassword = isHashed(newPassword)
    ? newPassword
    : hashPassword(newPassword);

  await query(
    `
      UPDATE mytv_users
      SET password_hash = $2, updated_at = NOW()
      WHERE username = $1
    `,
    [userName, storedPassword],
  );
}

export async function getStoredPassword(
  query: PostgresQuery,
  userName: string,
): Promise<string | null> {
  const result = await query<{ password_hash: string }>(
    `
      SELECT password_hash
      FROM mytv_users
      WHERE username = $1
    `,
    [userName],
  );

  return result.rows[0]?.password_hash || null;
}

export async function deleteUser(
  query: PostgresQuery,
  userName: string,
): Promise<void> {
  await query(
    `
      DELETE FROM mytv_users
      WHERE username = $1
    `,
    [userName],
  );
}

export async function getSearchHistory(
  query: PostgresQuery,
  userName: string,
): Promise<string[]> {
  const result = await query<{ keyword: string }>(
    `
      SELECT keyword
      FROM mytv_search_history
      WHERE username = $1
      ORDER BY updated_at DESC
    `,
    [userName],
  );

  return result.rows.map((row) => row.keyword);
}

export async function addSearchHistory(
  query: PostgresQuery,
  userName: string,
  keyword: string,
): Promise<void> {
  await query(
    `
      INSERT INTO mytv_search_history (username, keyword, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (username, keyword)
      DO UPDATE SET updated_at = NOW()
    `,
    [userName, keyword],
  );

  await query(
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

export async function deleteSearchHistory(
  query: PostgresQuery,
  userName: string,
  keyword?: string,
): Promise<void> {
  if (keyword) {
    await query(
      `
        DELETE FROM mytv_search_history
        WHERE username = $1 AND keyword = $2
      `,
      [userName, keyword],
    );
    return;
  }

  await query(
    `
      DELETE FROM mytv_search_history
      WHERE username = $1
    `,
    [userName],
  );
}

export async function getAllUsers(query: PostgresQuery): Promise<string[]> {
  const result = await query<{ username: string }>(
    `
      SELECT username
      FROM mytv_users
      ORDER BY username ASC
    `,
  );

  return result.rows.map((row) => row.username);
}
