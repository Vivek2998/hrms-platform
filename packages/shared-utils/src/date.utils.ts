import {
  format,
  parseISO,
  addDays,
  isWeekend,
  isSameDay,
  differenceInCalendarDays,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns';

// ─────────────────────────────────────────────────────────────
// Parsing & Formatting
// ─────────────────────────────────────────────────────────────

export function toDate(value: Date | string): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export function formatDate(date: Date | string, fmt = 'dd MMM yyyy'): string {
  return format(toDate(date), fmt);
}

export function formatDateTime(date: Date | string, fmt = 'dd MMM yyyy, hh:mm a'): string {
  return format(toDate(date), fmt);
}

export function formatTime(date: Date | string, fmt = 'hh:mm a'): string {
  return format(toDate(date), fmt);
}

/** Format date/time in a specific timezone using Intl (no extra deps) */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  },
): string {
  return new Intl.DateTimeFormat('en-IN', { timeZone: timezone, ...options }).format(toDate(date));
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// ─────────────────────────────────────────────────────────────
// Attendance — Shift calculations
// ─────────────────────────────────────────────────────────────

/**
 * Parse "HH:mm" shift time and attach it to a given calendar date.
 * Handles night shifts: if shiftEndTime < shiftStartTime, endDate = startDate + 1 day.
 */
export function resolveShiftTimes(
  date: Date,
  startTimeStr: string,
  endTimeStr: string,
): { start: Date; end: Date; isNightShift: boolean } {
  const [startH = 0, startM = 0] = startTimeStr.split(':').map(Number);
  const [endH = 0, endM = 0] = endTimeStr.split(':').map(Number);

  const start = new Date(date);
  start.setHours(startH, startM, 0, 0);

  const end = new Date(date);
  end.setHours(endH, endM, 0, 0);

  const isNightShift = end <= start;
  if (isNightShift) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end, isNightShift };
}

export function isLateArrival(punchIn: Date, shiftStart: Date, graceMinutes: number): boolean {
  return punchIn.getTime() > shiftStart.getTime() + graceMinutes * 60_000;
}

export function getLateMinutes(punchIn: Date, shiftStart: Date): number {
  return Math.max(0, Math.floor((punchIn.getTime() - shiftStart.getTime()) / 60_000));
}

export function getWorkingMinutes(punchIn: Date, punchOut: Date, breakMinutes = 0): number {
  const total = Math.floor((punchOut.getTime() - punchIn.getTime()) / 60_000);
  return Math.max(0, total - breakMinutes);
}

export function getOvertimeMinutes(
  workingMinutes: number,
  shiftDurationMinutes: number,
): number {
  return Math.max(0, workingMinutes - shiftDurationMinutes);
}

// ─────────────────────────────────────────────────────────────
// Working Days
// ─────────────────────────────────────────────────────────────

export function getWorkingDaysBetween(
  startDate: Date,
  endDate: Date,
  weeklyOffDays: number[] = [0, 6],
  holidays: Date[] = [],
): number {
  let count = 0;
  let current = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (!isAfter(current, end)) {
    const dayOfWeek = current.getDay();
    const isOff = weeklyOffDays.includes(dayOfWeek);
    const isHoliday = holidays.some((h) => isSameDay(h, current));

    if (!isOff && !isHoliday) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}

export function getWorkingDaysInMonth(
  year: number,
  month: number,
  weeklyOffDays: number[] = [0, 6],
  holidays: Date[] = [],
): number {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return getWorkingDaysBetween(start, end, weeklyOffDays, holidays);
}

// ─────────────────────────────────────────────────────────────
// Indian Financial Year (April 1 – March 31)
// ─────────────────────────────────────────────────────────────

export function getFinancialYear(date: Date = new Date()): { start: Date; end: Date; label: string } {
  const year = date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear();
  return {
    start: new Date(year, 3, 1),
    end: new Date(year + 1, 2, 31, 23, 59, 59, 999),
    label: `FY ${year}-${String(year + 1).slice(2)}`,
  };
}

export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const d = new Date(year, month - 1);
  return {
    start: startOfMonth(d),
    end: endOfMonth(d),
  };
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(startOfDay(date), { start: startOfDay(start), end: endOfDay(end) });
}

export function hasDateOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return isBefore(aStart, bEnd) && isAfter(aEnd, bStart);
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  return differenceInCalendarDays(startOfDay(date), startOfDay(from));
}

export function yearsOfService(joiningDate: Date, asOf: Date = new Date()): number {
  const months =
    (asOf.getFullYear() - joiningDate.getFullYear()) * 12 +
    (asOf.getMonth() - joiningDate.getMonth());
  return Math.floor(months / 12);
}

export function monthsOfService(joiningDate: Date, asOf: Date = new Date()): number {
  return (
    (asOf.getFullYear() - joiningDate.getFullYear()) * 12 +
    (asOf.getMonth() - joiningDate.getMonth())
  );
}
