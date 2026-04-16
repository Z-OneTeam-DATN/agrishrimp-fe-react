import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  differenceInCalendarWeeks,
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

export function formatDate(date: string | number | Date, pattern: string = "dd/MM/yyyy HH:mm"): string {
  try {
    const d = parseAppDate(date);
    if (isNaN(d.getTime())) return "N/A";
    return format(d, pattern, { locale: vi });
  } catch {
    return "N/A";
  }
}

function parseAppDate(date: string | number | Date): Date {
  if (date instanceof Date) {
    return date;
  }

  if (typeof date === "number") {
    return new Date(date);
  }

  if (typeof date === "string") {
    const trimmed = date.trim();
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

  return new Date(date);
}
