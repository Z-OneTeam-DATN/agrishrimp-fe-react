import { format, isToday, isYesterday, isThisWeek, differenceInCalendarWeeks } from 'date-fns'
import { vi } from 'date-fns/locale'

export function formatMessageTimestamp(timestamp: string | number | Date): string {
  const messageDate = new Date(timestamp)
  const now = new Date()

  if (isToday(messageDate)) {
    return `Hôm nay, ${format(messageDate, 'p', { locale: vi })}`
  }

  if (isYesterday(messageDate)) {
    return `Hôm qua, ${format(messageDate, 'p', { locale: vi })}`
  }

  if (isThisWeek(messageDate, { weekStartsOn: 1 })) {
    return format(messageDate, 'eeee, p', { locale: vi })
  }

  if (differenceInCalendarWeeks(now, messageDate, { weekStartsOn: 1 }) === 1) {
    return `Tuần trước, ${format(messageDate, 'eeee, p', { locale: vi })}`
  }

  return format(messageDate, 'P p', { locale: vi })
}
