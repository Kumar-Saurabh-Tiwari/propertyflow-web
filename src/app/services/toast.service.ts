import { Injectable, signal } from "@angular/core";

export type ToastKind = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  detail?: string;
}

@Injectable({ providedIn: "root" })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  show(kind: ToastKind, message: string, detail?: string, ttl = 5000) {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, kind, message, detail }]);
    if (ttl > 0) {
      setTimeout(() => this.dismiss(id), ttl);
    }
  }

  success(message: string, detail?: string) {
    this.show("success", message, detail);
  }

  error(message: string, detail?: string) {
    this.show("error", message, detail, 7000);
  }

  warning(message: string, detail?: string) {
    this.show("warning", message, detail, 7000);
  }

  info(message: string, detail?: string) {
    this.show("info", message, detail);
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
