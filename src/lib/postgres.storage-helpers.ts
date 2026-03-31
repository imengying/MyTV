import { type QueryResult, type QueryResultRow } from 'pg';

export type PostgresQuery = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
) => Promise<QueryResult<T>>;

type JsonRecordRow<T> = {
  storage_key: string;
  [key: string]: T | string;
};

export function parseJsonColumn<T>(value: T | string): T {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value;
}

export function mapJsonRecordRows<T>(
  rows: Array<JsonRecordRow<T>>,
  valueKey: string,
): Record<string, T> {
  return rows.reduce<Record<string, T>>((acc, row) => {
    acc[row.storage_key] = parseJsonColumn<T>(row[valueKey] as T | string);
    return acc;
  }, {});
}
