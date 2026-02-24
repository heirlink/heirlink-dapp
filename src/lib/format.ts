/**
 * Форматирует число с пробелами как разделителями тысяч: 100000000 → "100 000 000"
 */
export function formatNumberWithSpaces(value: string | number): string {
  const s = typeof value === "number" ? String(value) : value.trim();
  const [intPart, decPart] = s.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decPart != null && decPart !== ""
    ? `${formatted}.${decPart}`
    : formatted;
}
