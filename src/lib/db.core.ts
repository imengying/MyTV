import { PostgresStorage } from './postgres.db';
import { type IStorage } from './types';

function createStorage(): IStorage {
  return new PostgresStorage();
}

let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}
