export type DayStatus = "available" | "booked" | "blocked";

export interface Property {
  id: number;
  name: string;
  baseRate: number;
}

export interface Reservation {
  id: any;
  externalId: string | null;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  source: string;
}

export interface Block {
  id: number;
  propertyId: number;
  startDate: string;
  endDate: string;
  reason: string | null;
}

export interface RateOverridePayload {
  count: number;
  startDate: string;
  endDate: string;
  rate: number;
}

export interface CalendarDay {
  date: string;
  status: DayStatus;
  finalRate: number;
  reservationDetails?: Reservation;
}

export interface CalendarResponse {
  days: CalendarDay[];
}

export interface Booking extends Reservation {
  id: string;
}

export interface OwnerBlock {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface RateOverride {
  id: string;
  startDate: string;
  endDate: string;
  rate: number;
}

export interface DayCell {
  date: Date;
  iso: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  status: DayStatus;
  rate: number;
  booking?: Booking;
  block?: OwnerBlock;
  override?: RateOverride;
}

export interface CreateBookingRequest {
  guestName: string;
  checkIn: string;
  checkOut: string;
}

export interface CreateBlockRequest {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface SetOverrideRequest {
  startDate: string;
  endDate: string;
  rate: number;
}

export interface ReconcileItem {
  id: string;
  guest: string;
  checkIn: string;
  checkOut: string;
}

export interface ReconcileRejected extends ReconcileItem {
  reason: string;
  conflicts?: unknown[];
}

export interface ReconcileSummary {
  totalReceived: number;
  created: ReconcileItem[];
  updated: ReconcileItem[];
  unchanged: ReconcileItem[];
  cancelled: Array<{ id: string }>;
  duplicatesIgnored: ReconcileItem[];
  rejected: ReconcileRejected[];
}

export interface ReconcileResult {
  imported: number;
  deduplicated: number;
  rejected: number;
  conflicts: Array<{
    startDate: string;
    endDate: string;
    guestName: string;
    type: "booking" | "block";
  }>;
  feedSource: string;
  syncedAt: string;
}

export interface ReconcileResponse {
  success: boolean;
  result: ReconcileResult;
}

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
  details?: unknown;
}

export interface ApiError extends Error {
  status: number;
  details?: unknown;
}
