export function logError(message: string, detail?: unknown): void {
  // eslint-disable-next-line no-console
  console.error(message, detail);
}

export function logWarn(message: string, detail?: unknown): void {
  // eslint-disable-next-line no-console
  console.warn(message, detail);
}
