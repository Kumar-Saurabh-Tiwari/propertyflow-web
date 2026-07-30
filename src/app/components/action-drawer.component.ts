import { Component, inject, signal, computed, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CalendarStore } from "../services/calendar-store.service";
import { formatGBP, nightsBetween, fromISO } from "../utils/date-utils";

type Tab = "override" | "block" | "booking";

@Component({
  selector: "app-action-drawer",
  imports: [FormsModule],
  template: `
    @if (store.drawerOpen()) {
      <div class="fixed inset-0 z-40">
        <div class="absolute inset-0 bg-ink-950/30 animate-fade-in" (click)="store.clearSelection()"></div>

        <aside class="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-pop animate-slide-in-right">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <div>
              <h2 class="text-base font-semibold text-ink-900">Edit Dates</h2>
              <p class="mt-0.5 text-sm text-brand-600">{{ store.selectedRangeLabel() }}</p>
            </div>
            <button (click)="store.clearSelection()" class="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-ink-100">
            @for (t of tabs; track t.id) {
              <button
                (click)="activeTab.set(t.id)"
                class="flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition"
                [class.text-brand-600]="activeTab() === t.id"
                [class.border-b-2]="activeTab() === t.id"
                [class.border-brand-600]="activeTab() === t.id"
                [class.text-ink-500]="activeTab() !== t.id"
                [class.border-transparent]="activeTab() !== t.id"
                [class.hover:text-ink-700]="activeTab() !== t.id"
              >
                <span [innerHTML]="t.icon"></span>
                {{ t.label }}
              </button>
            }
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-5">
            @switch (activeTab()) {
              @case ("override") {
                <div class="space-y-4">
                  <p class="text-sm text-ink-600">Set a custom nightly rate for the selected range.</p>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">Nightly Rate (£)</label>
                    <div class="relative">
                      <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-400">£</span>
                      <input
                        type="number"
                        [(ngModel)]="overrideRate"
                        (ngModelChange)="overrideRate.set(+$event)"
                        min="0"
                        class="w-full rounded-lg border border-ink-200 py-2 pl-7 pr-3 text-sm font-medium text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        placeholder="120"
                      />
                    </div>
                  </div>
                  <div class="rounded-lg bg-ink-50 px-3 py-2.5 text-sm text-ink-600">
                    {{ nights() }} nights · <span class="font-semibold text-ink-900">{{ totalOverride() }}</span> total
                  </div>
                  <button
                    (click)="applyOverride()"
                    [disabled]="overrideRate() <= 0 || store.mutating()"
                    class="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    @if (store.mutating()) {
                      <span class="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    }
                    Apply Override Rate
                  </button>
                </div>
              }

              @case ("block") {
                <div class="space-y-4">
                  <p class="text-sm text-ink-600">Block dates for owner use or maintenance.</p>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">Reason (optional)</label>
                    <input
                      type="text"
                      [(ngModel)]="blockReason"
                      class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      placeholder="Maintenance, personal use…"
                    />
                  </div>
                  <button
                    (click)="applyBlock()"
                    [disabled]="store.mutating()"
                    class="w-full rounded-lg bg-ink-700 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    @if (store.mutating()) {
                      <span class="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    }
                    Block These Dates
                  </button>
                  <div class="border-t border-ink-100 pt-4">
                    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Already blocked?</p>
                    <button
                      (click)="unblock()"
                      [disabled]="store.mutating()"
                      class="w-full rounded-lg border border-ink-200 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      @if (store.mutating()) {
                        <span class="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-ink-400 border-t-transparent"></span>
                      }
                      Unblock These Dates
                    </button>
                  </div>
                </div>
              }

              @case ("booking") {
                <div class="space-y-4">
                  <p class="text-sm text-ink-600">Create a new direct booking for a guest.</p>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">Guest Name</label>
                    <input
                      type="text"
                      [(ngModel)]="guestName"
                      class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">Check-in</label>
                      <input
                        type="date"
                        [(ngModel)]="checkIn"
                        class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      />
                    </div>
                    <div>
                      <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-500">Check-out</label>
                      <input
                        type="date"
                        [(ngModel)]="checkOut"
                        class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      />
                    </div>
                  </div>
                  <div class="rounded-lg bg-brand-50 px-3 py-2.5 text-xs text-brand-700">
                    Checkout is exclusive — a guest checking out on a date can check in on that same date.
                  </div>
                  <button
                    (click)="createBooking()"
                    [disabled]="!canCreateBooking() || store.mutating()"
                    class="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    @if (store.mutating()) {
                      <span class="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    }
                    Create Booking
                  </button>
                </div>
              }
            }
          </div>
        </aside>
      </div>
    }
  `,
})
export class ActionDrawerComponent {
  store = inject(CalendarStore);

  activeTab = signal<Tab>("override");
  overrideRate = signal<number>(150);
  blockReason = signal<string>("");
  guestName = signal<string>("");
  checkIn = signal<string>("");
  checkOut = signal<string>("");

  tabs = [
    {
      id: "override" as Tab,
      label: "Set Rate",
      icon: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    },
    {
      id: "block" as Tab,
      label: "Block",
      icon: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 9h6v6H9z"/></svg>',
    },
    {
      id: "booking" as Tab,
      label: "New Booking",
      icon: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    },
  ];

  constructor() {
    effect(() => {
      const s = this.store.rangeStart();
      const e = this.store.rangeEnd();
      if (s && e) {
        this.checkIn.set(s);
        this.checkOut.set(e);
      }
    });
  }

  nights(): number {
    const s = this.store.rangeStart();
    const e = this.store.rangeEnd();
    if (!s || !e) return 0;
    return nightsBetween(fromISO(s), fromISO(e));
  }

  totalOverride(): string {
    return formatGBP(this.nights() * this.overrideRate());
  }

  canCreateBooking(): boolean {
    return (
      this.guestName().trim().length > 0 &&
      this.checkIn().length > 0 &&
      this.checkOut().length > 0 &&
      this.checkOut() > this.checkIn()
    );
  }

  applyOverride(): void {
    const s = this.store.rangeStart();
    const e = this.store.rangeEnd();
    if (!s || !e) return;
    this.store.setOverride({ startDate: s, endDate: e, rate: this.overrideRate() });
  }

  applyBlock(): void {
    const s = this.store.rangeStart();
    const e = this.store.rangeEnd();
    if (!s || !e) return;
    this.store.createBlock({ startDate: s, endDate: e, reason: this.blockReason() || undefined });
  }

  unblock(): void {
    const s = this.store.rangeStart();
    const e = this.store.rangeEnd();
    if (!s || !e) return;
    this.store.unblockRange(s, e);
  }

  createBooking(): void {
    if (!this.canCreateBooking()) return;
    this.store.createBooking({
      guestName: this.guestName().trim(),
      checkIn: this.checkIn(),
      checkOut: this.checkOut(),
    });
    this.guestName.set("");
  }
}
