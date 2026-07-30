import { Booking } from "../models/calendar.models";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function daysInclusive(start: Date, end: Date): number {
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return Math.round((e - s) / MS_PER_DAY) + 1;
}

export function nightsBetween(start: Date, end: Date): number {
  return Math.max(0, daysInclusive(start, end) - 1);
}

export function formatRangeShort(startISO: string, endISO: string): string {
  const start = fromISO(startISO);
  const end = fromISO(endISO);
  const s = start.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });
  if (start.getTime() === end.getTime()) return s;
  const e = end.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  return `${s} - ${e}`;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function inclusiveRange(startISO: string, endISO: string): string[] {
  const start = fromISO(startISO);
  const end = fromISO(endISO);
  const out: string[] = [];
  let cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur.getTime() <= last.getTime()) {
    out.push(toISO(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

export function rangeInclusive(startISO: string, endISO: string): string[] {
  return inclusiveRange(startISO, endISO);
}

export function rangeNights(startISO: string, endISO: string): string[] {
  const start = fromISO(startISO);
  const end = fromISO(endISO);
  const out: string[] = [];
  let cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur.getTime() < last.getTime()) {
    out.push(toISO(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return fromISO(aStart) <= fromISO(bEnd) && fromISO(bStart) <= fromISO(aEnd);
}

export function bookingOverlaps(
  newStart: string,
  newEnd: string,
  booking: Booking,
): boolean {
  const bStart = fromISO(booking.checkIn);
  const bEnd = addDays(fromISO(booking.checkOut), -1);
  const nStart = fromISO(newStart);
  const nEnd = newEnd <= newStart ? nStart : addDays(fromISO(newEnd), -1);
  return nStart <= bEnd && bStart <= nEnd;
}
