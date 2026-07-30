import { Component, inject } from "@angular/core";
import { CalendarStore } from "../services/calendar-store.service";
import { DayCell } from "../models/calendar.models";
import { formatGBP } from "../utils/date-utils";

@Component({
  selector: "app-calendar",
  template: `
    <div class="rounded-2xl border border-ink-200 bg-white shadow-card">
      <!-- Month navigation -->
      <div class="flex items-center justify-between border-b border-ink-100 px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-ink-900">{{ store.monthLabel() }}</h2>
          <button
            (click)="store.goToToday()"
            class="rounded-md border border-ink-200 px-2 py-0.5 text-xs font-medium text-ink-600 transition hover:bg-ink-50"
          >
            Today
          </button>
        </div>
        <div class="flex items-center gap-1">
          <button
            (click)="store.previousMonth()"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 transition hover:bg-ink-100"
            aria-label="Previous month"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button
            (click)="store.nextMonth()"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 transition hover:bg-ink-100"
            aria-label="Next month"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <!-- Weekday header -->
      <div class="grid grid-cols-7 border-b border-ink-100 bg-ink-50/50">
        @for (d of weekdays; track d) {
          <div class="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-400">
            {{ d }}
          </div>
        }
      </div>

      <!-- Day grid -->
      <div class="grid grid-cols-7">
        @for (cell of store.cells(); track cell.iso; let i = $index) {
          <button
            type="button"
            (click)="store.onDayClick(cell.iso)"
            (mouseenter)="store.onDayHover(cell.iso)"
            class="relative flex min-h-[92px] flex-col border-b border-r border-ink-100 p-1.5 text-left transition last:border-r-0 sm:min-h-[104px] sm:p-2"
            [class.border-r-0]="(i + 1) % 7 === 0"
            [class.cursor-pointer]="cell.isCurrentMonth"
            [class.opacity-40]="!cell.isCurrentMonth"
            [class.bg-brand-50]="store.isInRange(cell.iso)"
            [class.ring-2]="store.isRangeStart(cell.iso) || store.isRangeEnd(cell.iso)"
            [class.ring-inset]="store.isRangeStart(cell.iso) || store.isRangeEnd(cell.iso)"
            [class.ring-brand-400]="store.isRangeStart(cell.iso) || store.isRangeEnd(cell.iso)"
            [class.bg-ink-50/60]="cell.isWeekend && cell.isCurrentMonth && !store.isInRange(cell.iso)"
          >
            <!-- Date number -->
            <div class="flex items-center justify-between">
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                [class.bg-brand-600]="cell.isToday"
                [class.text-white]="cell.isToday"
                [class.text-ink-900]="!cell.isToday && cell.isCurrentMonth"
                [class.text-ink-400]="!cell.isCurrentMonth"
              >
                {{ cell.dayNumber }}
              </span>
              @if (cell.override) {
                <span class="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-700">OVR</span>
              }
            </div>

            <!-- Booking span pill -->
            @if (cell.booking) {
              <div
                class="mt-1.5 flex items-center gap-1 rounded-md bg-brand-600 px-1.5 py-1 text-white"
                [class.rounded-l-md]="isBookingStart(cell)"
                [class.rounded-r-md]="isBookingEnd(cell)"
                [class.rounded-l-none]="!isBookingStart(cell)"
                [class.rounded-r-none]="!isBookingEnd(cell)"
              >
                <span class="truncate text-[11px] font-medium leading-tight">
                  {{ cell.booking.guestName }}
                </span>
              </div>
            }

            <!-- Blocked span -->
            @if (cell.status === 'blocked') {
              <div
                class="mt-1.5 rounded-md border border-dashed border-ink-400 bg-ink-100 px-1.5 py-1"
                [class.rounded-l-md]="isBlockStart(cell)"
                [class.rounded-r-md]="isBlockEnd(cell)"
                [class.rounded-l-none]="!isBlockStart(cell)"
                [class.rounded-r-none]="!isBlockEnd(cell)"
                style="background-image: repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 5px);"
              >
                <span class="text-[11px] font-medium text-ink-600">Blocked</span>
              </div>
            }

            <!-- Rate / status -->
            <div class="mt-auto pt-1">
              @if (cell.status === 'available') {
                <span class="text-[11px] font-semibold text-ink-700">{{ money(cell.rate) }}</span>
              } @else if (cell.status === 'booked') {
                <span class="text-[11px] font-medium text-brand-700">{{ money(cell.rate) }}</span>
              } @else {
                <span class="text-[11px] font-medium text-ink-400">—</span>
              }
            </div>

            <!-- Status dot -->
            <div class="absolute right-1.5 top-1.5">
              @switch (cell.status) {
                @case ("available") {
                  <span class="block h-2 w-2 rounded-full bg-green-400"></span>
                }
                @case ("booked") {
                  <span class="block h-2 w-2 rounded-full bg-brand-500"></span>
                }
                @case ("blocked") {
                  <span class="block h-2 w-2 rounded-full bg-ink-400"></span>
                }
              }
            </div>
          </button>
        }
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-4 border-t border-ink-100 px-4 py-3 sm:px-6">
        <div class="flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-green-400"></span>
          <span class="text-xs text-ink-600">Available</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-brand-500"></span>
          <span class="text-xs text-ink-600">Booked</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-ink-400"></span>
          <span class="text-xs text-ink-600">Blocked</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-700">OVR</span>
          <span class="text-xs text-ink-600">Rate Override</span>
        </div>
        <div class="ml-auto hidden text-xs text-ink-400 sm:block">
          Click a start date, then an end date to select a range
        </div>
      </div>
    </div>
  `,
})
export class CalendarComponent {
  store = inject(CalendarStore);
  weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  money(v: number): string {
    return formatGBP(v);
  }

  isBookingStart(cell: DayCell): boolean {
    if (!cell.booking) return false;
    return cell.iso === cell.booking.checkIn;
  }

  isBookingEnd(cell: DayCell): boolean {
    if (!cell.booking) return false;
    const checkout = cell.booking.checkOut;
    const lastNight = new Date(checkout);
    lastNight.setDate(lastNight.getDate() - 1);
    return cell.iso === lastNight.toISOString().slice(0, 10);
  }

  isBlockStart(cell: DayCell): boolean {
    if (!cell.block) return false;
    return cell.iso === cell.block.startDate;
  }

  isBlockEnd(cell: DayCell): boolean {
    if (!cell.block) return false;
    return cell.iso === cell.block.endDate;
  }
}
