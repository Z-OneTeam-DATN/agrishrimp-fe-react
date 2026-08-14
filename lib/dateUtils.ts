import {
  endOfMonth,
  endOfDay,
  format,
  isToday,
  isYesterday,
  isThisWeek,
  differenceInCalendarWeeks,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { vi } from "date-fns/locale";

export function formatMessageTimestamp(
  timestamp: string | number | Date,
): string {
  const messageDate = new Date(timestamp);
  const now = new Date();

  if (isToday(messageDate)) {
    return `Hôm nay, ${format(messageDate, "p", { locale: vi })}`;
  }

  if (isYesterday(messageDate)) {
    return `Hôm qua, ${format(messageDate, "p", { locale: vi })}`;
  }

  if (isThisWeek(messageDate, { weekStartsOn: 1 })) {
    return format(messageDate, "eeee, p", { locale: vi });
  }

  if (differenceInCalendarWeeks(now, messageDate, { weekStartsOn: 1 }) === 1) {
    return `Tuần trước, ${format(messageDate, "eeee, p", { locale: vi })}`;
  }

  return format(messageDate, "P p", { locale: vi });
}

export function formatDate(date: unknown, pattern: string = "dd/MM/yyyy HH:mm"): string {
  try {
    const d = parseAppDate(date);
    if (isNaN(d.getTime())) return "N/A";
    return format(d, pattern, { locale: vi });
  } catch {
    return "N/A";
  }
}

/**
 * Parse a Java LocalDateTime string (e.g. "2026-07-17T14:51:00") as local time.
 * new Date("2026-07-17T14:51:00") would treat it as UTC and shift by +7h in Vietnam.
 * This function constructs the Date correctly in the browser's local timezone.
 */
export function parseLocalDateTime(date: unknown): Date {
  return parseAppDate(date);
}

export function toDateTimeLocalValue(date: Date): string {
  const normalized = new Date(date);
  normalized.setSeconds(0, 0);
  return format(normalized, "yyyy-MM-dd'T'HH:mm");
}

export function getCurrentMonthDateTimeRange(baseDate: Date = new Date()) {
  const start = startOfMonth(baseDate);
  start.setHours(0, 0, 0, 0);

  const end = endOfMonth(baseDate);
  end.setHours(23, 59, 0, 0);

  return {
    start: toDateTimeLocalValue(start),
    end: toDateTimeLocalValue(end),
  };
}

export function getCurrentDayDateTimeRange(baseDate: Date = new Date()) {
  const start = startOfDay(baseDate);
  start.setHours(0, 0, 0, 0);

  const end = endOfDay(baseDate);
  end.setHours(23, 59, 0, 0);

  return {
    start: toDateTimeLocalValue(start),
    end: toDateTimeLocalValue(end),
  };
}

function parseAppDate(date: string | number | Date | unknown): Date {

  if (date instanceof Date) {
    return date;
  }

  // Handle Java LocalDateTime serialized as array: [year, month, day, hour, min, sec, nano?]
  if (Array.isArray(date)) {
    const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = date as number[];
    return new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1_000_000));
  }

  if (typeof date === "number") {
    return new Date(date);
  }

  if (typeof date === "string") {
    // Remove trailing Z and offset (like +00:00 or -0500) to treat string strictly as local time (not UTC)
    const trimmed = date.trim()
      .replace(/Z$/, "")
      .replace(/([+-]\d{2}):?(\d{2})$/, "");
    const localDateTimeMatch = trimmed.match(
      /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,9}))?$/
    );

    if (localDateTimeMatch) {
      const [, year, month, day, hour, minute, second = "0", fractional = "0"] = localDateTimeMatch;
      const milliseconds = Number(fractional.padEnd(3, "0").slice(0, 3));

      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        milliseconds
      );
    }
  }

  // Fallback: let browser parse - remove trailing Z and offset to avoid UTC interpretation
  const rawDateStr = typeof date === "string"
    ? date.trim().replace(/Z$/, "").replace(/([+-]\d{2}):?(\d{2})$/, "")
    : String(date);
  return new Date(rawDateStr);
}
