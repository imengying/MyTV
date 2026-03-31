import { type IStorage } from './types';

export async function registerUser(
  storage: IStorage,
  userName: string,
  password: string,
): Promise<void> {
  await storage.registerUser(userName, password);
}

export async function verifyUser(
  storage: IStorage,
  userName: string,
  password: string,
): Promise<boolean> {
  return storage.verifyUser(userName, password);
}

export async function checkUserExist(
  storage: IStorage,
  userName: string,
): Promise<boolean> {
  return storage.checkUserExist(userName);
}

export async function changePassword(
  storage: IStorage,
  userName: string,
  newPassword: string,
): Promise<void> {
  await storage.changePassword(userName, newPassword);
}

export async function getStoredPassword(
  storage: IStorage,
  userName: string,
): Promise<string | null> {
  return storage.getStoredPassword(userName);
}

export async function deleteUser(
  storage: IStorage,
  userName: string,
): Promise<void> {
  await storage.deleteUser(userName);
}

export async function getSearchHistory(
  storage: IStorage,
  userName: string,
): Promise<string[]> {
  return storage.getSearchHistory(userName);
}

export async function addSearchHistory(
  storage: IStorage,
  userName: string,
  keyword: string,
): Promise<void> {
  await storage.addSearchHistory(userName, keyword);
}

export async function deleteSearchHistory(
  storage: IStorage,
  userName: string,
  keyword?: string,
): Promise<void> {
  await storage.deleteSearchHistory(userName, keyword);
}

export async function getAllUsers(storage: IStorage): Promise<string[]> {
  return storage.getAllUsers();
}
