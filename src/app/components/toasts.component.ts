import { Component, inject } from "@angular/core";
import { ToastService } from "../services/toast.service";

@Component({
  selector: "app-toasts",
  template: `
    <div class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-pop animate-slide-up"
          [class.border-green-200]="t.kind === 'success'"
          [class.border-red-200]="t.kind === 'error'"
          [class.border-amber-200]="t.kind === 'warning'"
          [class.border-brand-200]="t.kind === 'info'"
        >
          <div
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            [class.bg-green-50]="t.kind === 'success'"
            [class.bg-red-50]="t.kind === 'error'"
            [class.bg-amber-50]="t.kind === 'warning'"
            [class.bg-brand-50]="t.kind === 'info'"
          >
            @switch (t.kind) {
              @case ("success") {
                <svg class="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              }
              @case ("error") {
                <svg class="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              }
              @case ("warning") {
                <svg class="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
              }
              @case ("info") {
                <svg class="h-4 w-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              }
            }
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-ink-900">{{ t.message }}</p>
            @if (t.detail) {
              <p class="mt-0.5 text-xs text-ink-500">{{ t.detail }}</p>
            }
          </div>
          <button
            (click)="toast.dismiss(t.id)"
            class="shrink-0 rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-600"
            aria-label="Dismiss"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastsComponent {
  toast = inject(ToastService);
}
