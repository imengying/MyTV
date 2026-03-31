import { type Favorite, type IStorage, type PlayRecord } from './types';
import { generateStorageKey } from './db.core';

export async function getPlayRecord(
  storage: IStorage,
  userName: string,
  source: string,
  id: string,
): Promise<PlayRecord | null> {
  return storage.getPlayRecord(userName, generateStorageKey(source, id));
}

export async function savePlayRecord(
  storage: IStorage,
  userName: string,
  source: string,
  id: string,
  record: PlayRecord,
): Promise<void> {
  await storage.setPlayRecord(userName, generateStorageKey(source, id), record);
}

export async function deletePlayRecord(
  storage: IStorage,
  userName: string,
  source: string,
  id: string,
): Promise<void> {
  await storage.deletePlayRecord(userName, generateStorageKey(source, id));
}

export async function getAllPlayRecords(
  storage: IStorage,
  userName: string,
): Promise<Record<string, PlayRecord>> {
  return storage.getAllPlayRecords(userName);
}

export async function deleteAllPlayRecords(
  storage: IStorage,
  userName: string,
): Promise<void> {
  await storage.deleteAllPlayRecords(userName);
}

export async function getFavorite(
  storage: IStorage,
  userName: string,
  source: string,
  id: string,
): Promise<Favorite | null> {
  return storage.getFavorite(userName, generateStorageKey(source, id));
}

export async function saveFavorite(
  storage: IStorage,
  userName: string,
  source: string,
  id: string,
  favorite: Favorite,
): Promise<void> {
  await storage.setFavorite(userName, generateStorageKey(source, id), favorite);
}

export async function deleteFavorite(
  storage: IStorage,
  userName: string,
  source: string,
  id: string,
): Promise<void> {
  await storage.deleteFavorite(userName, generateStorageKey(source, id));
}

export async function getAllFavorites(
  storage: IStorage,
  userName: string,
): Promise<Record<string, Favorite>> {
  return storage.getAllFavorites(userName);
}

export async function deleteAllFavorites(
  storage: IStorage,
  userName: string,
): Promise<void> {
  await storage.deleteAllFavorites(userName);
}

export async function isFavorited(
  storage: IStorage,
  userName: string,
  source: string,
  id: string,
): Promise<boolean> {
  const favorite = await getFavorite(storage, userName, source, id);
  return favorite !== null;
}
