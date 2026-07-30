import { Component, inject } from "@angular/core";
import { CalendarStore } from "../services/calendar-store.service";
import { formatRangeShort } from "../utils/date-utils";

@Component({
  selector: "app-sync-modal",
  template: `
    @if (store.syncModalOpen()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-ink-950/40 animate-fade-in" (click)="store.closeSyncModal()"></div>
        <div class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-pop animate-slide-up">
          <div class="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <div class="flex items-center gap-2.5">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <svg class="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
              </div>
              <div>
                <h2 class="text-base font-semibold text-ink-900">Channel Sync Complete</h2>
                <p class="text-xs text-ink-500">{{ result()?.feedSource }} · {{ syncedAt }}</p>
              </div>
            </div>
            <button (click)="store.closeSyncModal()" class="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="grid grid-cols-3 divide-x divide-ink-100 border-b border-ink-100">
            <div class="px-4 py-4 text-center">
              <p class="text-2xl font-bold text-green-600">{{ result()?.imported }}</p>
              <p class="mt-0.5 text-xs font-medium text-ink-500">Imported</p>
            </div>
            <div class="px-4 py-4 text-center">
              <p class="text-2xl font-bold text-ink-500">{{ result()?.deduplicated }}</p>
              <p class="mt-0.5 text-xs font-medium text-ink-500">Deduplicated</p>
            </div>
            <div class="px-4 py-4 text-center">
              <p class="text-2xl font-bold text-red-500">{{ result()?.rejected }}</p>
              <p class="mt-0.5 text-xs font-medium text-ink-500">Rejected</p>
            </div>
          </div>

          <div class="max-h-64 overflow-y-auto px-5 py-4">
            <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Conflicts Rejected</h3>
            @if ((result()?.conflicts?.length ?? 0) === 0) {
              <div class="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
                <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                No conflicts — all reservations reconciled cleanly.
              </div>
            } @else {
              <ul class="space-y-2">
                @for (c of result()?.conflicts ?? []; track c.startDate + c.guestName) {
                  <li class="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2.5">
                    <svg class="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-ink-900">{{ c.guestName }}</p>
                      <p class="text-xs text-ink-500">{{ range(c.startDate, c.endDate) }} · overlaps existing {{ c.type }}</p>
                    </div>
                  </li>
                }
              </ul>
            }
          </div>

          <div class="flex justify-end border-t border-ink-100 px-5 py-3.5">
            <button
              (click)="store.closeSyncModal()"
              class="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class SyncModalComponent {
  store = inject(CalendarStore);
  result = this.store.lastSync;

  get syncedAt(): string {
    const iso = this.result()?.syncedAt;
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  range(s: string, e: string): string {
    return formatRangeShort(s, e);
  }
}
