export const RECENT_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

export function isRecent(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return Date.now() - d.getTime() < RECENT_THRESHOLD_MS;
}

export function isPermitExpired(date: string | Date): boolean {
  const expiryDate = typeof date === "string" ? new Date(date) : date;
  return expiryDate < new Date();
}
