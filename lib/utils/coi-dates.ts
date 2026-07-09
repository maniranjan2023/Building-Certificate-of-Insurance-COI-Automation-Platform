import type { ExtractionAgentOutput } from "@/lib/ai/schemas";

export function parseCoiDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const us = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (us) {
    const year = us[3].length === 2 ? 2000 + parseInt(us[3], 10) : parseInt(us[3], 10);
    return startOfDay(new Date(year, parseInt(us[1], 10) - 1, parseInt(us[2], 10)));
  }
  const iso = Date.parse(value);
  return Number.isNaN(iso) ? null : startOfDay(new Date(iso));
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysUntilExpiry(expiration: Date, from: Date = new Date()): number {
  return daysBetween(startOfDay(from), startOfDay(expiration));
}

export function asExtraction(value: unknown): ExtractionAgentOutput | null {
  return value && typeof value === "object" ? (value as ExtractionAgentOutput) : null;
}

export function getExpirationDate(extractedFields: unknown): Date | null {
  return parseCoiDate(asExtraction(extractedFields)?.expirationDate);
}

export function addDays(date: Date, days: number): Date {
  const copy = startOfDay(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function resolveExpirationDate(version: {
  expirationDate?: Date | null;
  extractedFields?: unknown;
}): Date | null {
  if (version.expirationDate) {
    return startOfDay(version.expirationDate);
  }
  return getExpirationDate(version.extractedFields);
}
