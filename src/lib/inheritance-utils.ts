export const ETH_PLACEHOLDER =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const isValidAddress = (addr: string) =>
  /^0x[a-fA-F0-9]{40}$/.test(addr.trim());

export const normalizeAddress = (addr: string) =>
  addr.trim().toLowerCase();

export function resizeArray<T>(arr: T[], len: number, fill: T): T[] {
  if (arr.length === len) return arr;
  if (arr.length === 0) return Array(len).fill(fill);
  const next = [...arr];
  while (next.length < len) next.push(fill);
  return next.slice(0, len);
}
