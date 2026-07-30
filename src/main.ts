import { Component, inject, OnInit } from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { bootstrapApplication } from "@angular/platform-browser";
import { apiErrorInterceptor } from "./app/interceptors/api-error.interceptor";
import { ToolbarComponent } from "./app/components/toolbar.component";
import { CalendarComponent } from "./app/components/calendar.component";
import { ActionDrawerComponent } from "./app/components/action-drawer.component";
import { SyncModalComponent } from "./app/components/sync-modal.component";
import { ToastsComponent } from "./app/components/toasts.component";
import { CalendarStore } from "./app/services/calendar-store.service";

@Component({
  selector: "app-root",
  imports: [
    ToolbarComponent,
    CalendarComponent,
    ActionDrawerComponent,
    SyncModalComponent,
    ToastsComponent,
  ],
  template: `
    <div class="min-h-screen bg-ink-50">
      <app-toolbar />

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        @if (store.hasSelection()) {
          <div class="mb-4 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 animate-slide-up">
            <div class="flex items-center gap-2 text-sm">
              <svg class="h-4 w-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              <span class="font-medium text-brand-800">Selected:</span>
              <span class="text-brand-700">{{ store.selectedRangeLabel() }}</span>
            </div>
            <button
              (click)="store.drawerOpen.set(true)"
              class="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              Edit Range
            </button>
          </div>
        }

        <app-calendar />

        @if (store.loading()) {
          <div class="mt-6 flex items-center justify-center gap-2 text-sm text-ink-500">
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading calendar…
          </div>
        }
      </main>

      <app-action-drawer />
      <app-sync-modal />
      <app-toasts />
    </div>
  `,
})
export class App implements OnInit {
  store = inject(CalendarStore);

  ngOnInit(): void {
    this.store.load();
  }
}

bootstrapApplication(App, {
  providers: [provideHttpClient(withInterceptors([apiErrorInterceptor]))],
});
