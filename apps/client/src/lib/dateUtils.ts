export function isPermitExpired(date: string | Date): boolean {
  const expiryDate = typeof date === "string" ? new Date(date) : date;
  return expiryDate < new Date();
}
