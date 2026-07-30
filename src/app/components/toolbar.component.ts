import { Component, inject } from "@angular/core";
import { CalendarStore } from "../services/calendar-store.service";

@Component({
  selector: "app-toolbar",
  template: `
    <header
      class="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur"
    >
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9.5 12 3l9 6.5" />
              <path d="M5 10v10h14V10" />
              <path d="M9 20v-6h6v6" />
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-semibold leading-tight text-ink-900">StaySync</h1>
            <p class="text-xs text-ink-500">Availability & Pricing Manager</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="hidden items-center gap-2 rounded-lg bg-ink-50 px-3 py-1.5 sm:flex">
            <span class="h-2 w-2 rounded-full" [class.bg-green-500]="!store.syncing()" [class.bg-amber-400]="store.syncing()"></span>
            <span class="text-xs font-medium text-ink-600">
              {{ store.syncing() ? "Syncing…" : "Channel feed ready" }}
            </span>
          </div>

          <button
            (click)="store.reconcile()"
            [disabled]="store.syncing()"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg class="h-4 w-4" [class.animate-spin]="store.syncing()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Sync Channel Feed
          </button>
        </div>
      </div>
    </header>
  `,
})
export class ToolbarComponent {
  store = inject(CalendarStore);
}
