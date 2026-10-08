import type { ReactNode } from "react";
import { create } from "zustand";

import type { ToastVariant } from "@/components/ui/toast/toast.types";

const DEFAULT_DURATION_MS = 4000;

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: ReactNode;
  description?: ReactNode;
}

interface ShowToastInput extends Omit<ToastItem, "id" | "variant"> {
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms; pass 0 to keep the toast until dismissed. */
  durationMs?: number;
}

interface ToastState {
  toasts: ToastItem[];
  show: (input: ShowToastInput) => string;
  dismiss: (id: string) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: ({ durationMs = DEFAULT_DURATION_MS, variant = "info", ...toast }) => {
    const id = `toast-${++nextId}`;
    set({ toasts: [...get().toasts, { id, variant, ...toast }] });
    if (durationMs > 0) setTimeout(() => get().dismiss(id), durationMs);
    return id;
  },

  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));
