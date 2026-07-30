import { Injectable, computed, signal, inject } from "@angular/core";
import { finalize } from "rxjs";
import { CalendarApiService } from "./calendar-api.service";
import { ToastService } from "./toast.service";
import {
  Booking,
  OwnerBlock,
  RateOverride,
  DayCell,
  CreateBookingRequest,
  CreateBlockRequest,
  SetOverrideRequest,
  ReconcileResult,
  ApiError,
} from "../models/calendar.models";
import {
  toISO,
  fromISO,
  startOfDay,
  addDays,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isWeekend,
  formatMonthYear,
} from "../utils/date-utils";

export type SelectionMode = "none" | "pending-end";

@Injectable({ providedIn: "root" })
export class CalendarStore {
  private api = inject(CalendarApiService);
  private toast = inject(ToastService);

  readonly viewDate = signal<Date>(new Date(2026, 7, 1));
  readonly bookings = signal<Booking[]>([]);
  readonly blocks = signal<OwnerBlock[]>([]);
  readonly overrides = signal<RateOverride[]>([]);
  readonly loading = signal<boolean>(true);
  readonly syncing = signal<boolean>(false);
  readonly mutating = signal<boolean>(false);
  readonly lastSync = signal<ReconcileResult | null>(null);
  readonly baseRate = signal<number>(120);

  readonly rangeStart = signal<string | null>(null);
  readonly rangeEnd = signal<string | null>(null);
  readonly hoverDate = signal<string | null>(null);

  readonly drawerOpen = signal<boolean>(false);
  readonly syncModalOpen = signal<boolean>(false);

  readonly monthLabel = computed(() => formatMonthYear(this.viewDate()));

  readonly hasSelection = computed(
    () => this.rangeStart() !== null && this.rangeEnd() !== null,
  );

  readonly selectedRangeLabel = computed(() => {
    const s = this.rangeStart();
    const e = this.rangeEnd();
    if (!s || !e) return "";
    const sd = fromISO(s);
    const ed = fromISO(e);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
    return `${fmt(sd)} - ${fmt(ed)}`;
  });

  readonly cells = computed<DayCell[]>(() => {
    const view = this.viewDate();
    const first = startOfMonth(view);
    const last = endOfMonth(view);
    const startWeekday = first.getDay(); // 0 Sun
    const gridStart = addDays(first, -startWeekday);
    const totalCells = 42;
    const cells: DayCell[] = [];

    const bookingMap = this.buildBookingMap();
    const blockMap = this.buildBlockMap();
    const overrideMap = this.buildOverrideMap();
    const today = startOfDay(new Date());

    for (let i = 0; i < totalCells; i++) {
      const date = addDays(gridStart, i);
      const iso = toISO(date);
      const booking = bookingMap.get(iso);
      const block = blockMap.get(iso);
      const override = overrideMap.get(iso);

      let status: DayCell["status"] = "available";
      if (booking) status = "booked";
      else if (block) status = "blocked";

      const rate = override ? override.rate : this.baseRate();

      cells.push({
        date,
        iso,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === view.getMonth(),
        isToday: isSameDay(date, today),
        isWeekend: isWeekend(date),
        status,
        rate,
        booking,
        block,
        override,
      });
    }
    return cells;
  });

  load(): void {
    this.loading.set(true);
    const start = this.monthRangeStart();
    const end = this.monthRangeEnd();

    this.api.getCalendar(start, end).subscribe({
      next: (days) => {
        const bookings: Booking[] = [];
        const blocks: OwnerBlock[] = [];
        const overrides: RateOverride[] = [];

        for (const day of days) {
          if (day.status === "booked" && day.reservationDetails) {
            bookings.push({
              id: String(day.reservationDetails.id),
              externalId: day.reservationDetails.externalId,
              guestName: day.reservationDetails.guestName,
              checkIn: day.reservationDetails.checkIn,
              checkOut: day.reservationDetails.checkOut,
              source: day.reservationDetails.source,
              status: "confirmed",
            });
          }

          if (day.status === "blocked") {
            blocks.push({
              id: `block-${day.date}`,
              startDate: day.date,
              endDate: day.date,
              reason: "Blocked",
            });
          }

          if (day.finalRate !== this.baseRate()) {
            overrides.push({
              id: `override-${day.date}`,
              startDate: day.date,
              endDate: day.date,
              rate: day.finalRate,
            });
          }
        }

        this.bookings.set(bookings);
        this.blocks.set(blocks);
        this.overrides.set(overrides);
      },
      error: (err) => this.handleError(err, "Could not load calendar data."),
      complete: () => this.loading.set(false),
    });

    this.api.getBaseRate().subscribe({
      next: (rate) => this.baseRate.set(rate),
      error: (err) => this.handleError(err, "Could not load base rate."),
    });
  }

  previousMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.load();
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.load();
  }

  goToToday(): void {
    this.viewDate.set(new Date());
    this.load();
  }

  onDayClick(iso: string): void {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (!start || (start && end)) {
      this.rangeStart.set(iso);
      this.rangeEnd.set(null);
      this.hoverDate.set(null);
      return;
    }
    if (iso < start) {
      this.rangeStart.set(iso);
      this.rangeEnd.set(null);
      return;
    }
    this.rangeEnd.set(iso);
    this.drawerOpen.set(true);
  }

  onDayHover(iso: string): void {
    if (this.rangeStart() && !this.rangeEnd()) {
      this.hoverDate.set(iso);
    }
  }

  clearSelection(): void {
    this.rangeStart.set(null);
    this.rangeEnd.set(null);
    this.hoverDate.set(null);
    this.drawerOpen.set(false);
  }

  isInRange(iso: string): boolean {
    const s = this.rangeStart();
    const e = this.rangeEnd();
    if (s && e) return iso >= s && iso <= e;
    if (s && !e) {
      const h = this.hoverDate();
      if (h) {
        const lo = s < h ? s : h;
        const hi = s < h ? h : s;
        return iso >= lo && iso <= hi;
      }
      return iso === s;
    }
    return false;
  }

  isRangeStart(iso: string): boolean {
    return this.rangeStart() === iso;
  }

  isRangeEnd(iso: string): boolean {
    return this.rangeEnd() === iso;
  }

  createBooking(req: CreateBookingRequest): void {
    this.mutating.set(true);
    this.api.createBooking(req).pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: (b) => {
        this.bookings.update((list) => [...list, b]);
        this.toast.success(
          "Booking created",
          `${b.guestName} · ${this.fmtRange(req.checkIn, req.checkOut)}`,
        );
        this.clearSelection();
        this.load();
      },
      error: (err) => this.handleConflict(err),
    });
  }

  createBlock(req: CreateBlockRequest): void {
    this.mutating.set(true);
    this.api.createBlock(req).pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: (block) => {
        this.blocks.update((list) => [...list, block]);
        this.toast.success("Dates blocked", this.fmtRange(req.startDate, req.endDate));
        this.clearSelection();
        this.load();
      },
      error: (err) => this.handleConflict(err),
    });
  }

  unblockRange(startISO: string, endISO: string): void {
    const toRemove = this.blocks().filter(
      (b) => b.startDate === startISO && b.endDate === endISO,
    );
    if (toRemove.length === 0) {
      this.toast.warning("No owner block found on the selected dates.");
      return;
    }
    toRemove.forEach((b) => {
      this.mutating.set(true);
      this.api.removeBlock(b.startDate, b.endDate).pipe(finalize(() => this.mutating.set(false))).subscribe({
        next: () => {
          this.blocks.update((list) => list.filter((x) => x.id !== b.id));
          this.toast.success("Dates unblocked", this.fmtRange(startISO, endISO));
          this.clearSelection();
          this.load();
        },
        error: (err) => this.handleError(err, "Could not remove the block."),
      });
    });
  }

  setOverride(req: SetOverrideRequest): void {
    this.mutating.set(true);
    this.api.setOverride(req).pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: (o) => {
        this.overrides.update((list) => [...list, o]);
        this.toast.success(
          "Override rate applied",
          `£${req.rate}/night · ${this.fmtRange(req.startDate, req.endDate)}`,
        );
        this.clearSelection();
        this.load();
      },
      error: (err) => this.handleError(err, "Could not apply the rate override."),
    });
  }

  reconcile(): void {
    this.syncing.set(true);
    this.api.reconcile().pipe(finalize(() => this.syncing.set(false))).subscribe({
      next: (res) => {
        this.lastSync.set(res.result);
        this.syncModalOpen.set(true);
        this.load();
      },
      error: (err) => {
        this.handleError(err, "Could not reach the channel feed.");
      },
    });
  }

  closeSyncModal(): void {
    this.syncModalOpen.set(false);
  }

  private handleConflict(err: any): void {
    if (err instanceof Error && (err as ApiError).status === 409) {
      this.toast.warning("Dates unavailable", this.describeConflict(err));
    } else {
      this.handleError(err, "Please try again.");
    }
  }

  private handleError(err: any, fallback: string): void {
    const message = this.describeError(err, fallback);
    this.toast.error("Something went wrong", message);
  }

  private describeError(err: any, fallback: string): string {
    if (err instanceof Error && (err as ApiError).status === 409) {
      return this.describeConflict(err);
    }

    if (err instanceof Error && (err as ApiError).status === 400) {
      return err.message;
    }

    if (err instanceof Error && (err as ApiError).details) {
      return this.formatDetails(err);
    }

    return err?.message ?? fallback;
  }

  private describeConflict(err: any): string {
    const details = (err as ApiError).details;
    if (details && typeof details === "object") {
      const message = (details as any).error?.message ?? (details as any).message;
      if (message) return message;
      const conflicts = (details as any).conflicts;
      if (Array.isArray(conflicts) && conflicts.length > 0) {
        const c = conflicts[0];
        if (c?.guestName || c?.reason) {
          return `${c.guestName ?? "Existing booking"} already occupies those dates.`;
        }
      }
    }
    return err.message;
  }

  private formatDetails(details: unknown): string {
    if (details && typeof details === "object") {
      const payload = details as any;
      if (payload.error?.message) return payload.error.message;
      if (payload.message) return payload.message;
      if (Array.isArray(payload.conflicts) && payload.conflicts.length > 0) {
        const conflict = payload.conflicts[0];
        return conflict.guestName || conflict.reason || "The selected dates overlap an existing booking or block.";
      }
    }
    return String(details);
  }

  private fmtRange(startISO: string, endISO: string): string {
    const s = fromISO(startISO);
    const e = fromISO(endISO);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
    return `${fmt(s)} - ${fmt(e)}`;
  }

  private monthRangeStart(): string {
    const view = this.viewDate();
    const first = startOfMonth(view);
    return toISO(first);
  }

  private monthRangeEnd(): string {
    const view = this.viewDate();
    const last = endOfMonth(view);
    return toISO(last);
  }

  private buildBookingMap(): Map<string, Booking> {
    const map = new Map<string, Booking>();
    for (const b of this.bookings()) {
      const start = new Date(b.checkIn);
      const endExclusive = new Date(b.checkOut);
      let cur = startOfDay(start);
      const last = addDays(startOfDay(endExclusive), -1);
      while (cur.getTime() <= last.getTime()) {
        map.set(toISO(cur), b);
        cur = addDays(cur, 1);
      }
    }
    return map;
  }

  private buildBlockMap(): Map<string, OwnerBlock> {
    const map = new Map<string, OwnerBlock>();
    for (const b of this.blocks()) {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      let cur = startOfDay(start);
      const last = startOfDay(end);
      while (cur.getTime() <= last.getTime()) {
        map.set(toISO(cur), b);
        cur = addDays(cur, 1);
      }
    }
    return map;
  }

  private buildOverrideMap(): Map<string, RateOverride> {
    const map = new Map<string, RateOverride>();
    for (const o of this.overrides()) {
      const start = new Date(o.startDate);
      const end = new Date(o.endDate);
      let cur = startOfDay(start);
      const last = startOfDay(end);
      while (cur.getTime() <= last.getTime()) {
        map.set(toISO(cur), o);
        cur = addDays(cur, 1);
      }
    }
    return map;
  }
}
