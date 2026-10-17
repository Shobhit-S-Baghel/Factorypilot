/**
 * Deterministic timestamp and date formatting utilities.
 * Eliminates React SSR hydration mismatches by avoiding browser locale-dependent AM/PM string formats.
 */

export function formatTimestamp(dateInput: string | Date | number): string {
  if (!dateInput) return "--:--:--";
  const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`; // ISO 24h format eliminates AM/PM locale discrepancies
}

export function formatTimeShort(dateInput: string | Date | number): string {
  if (!dateInput) return "--:--";
  const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
