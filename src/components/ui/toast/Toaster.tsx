"use client";

import { useToastStore } from "@/store/useToastStore";
import { cn } from "@/utils/cn";

import { Toast } from "./Toast";
import type { ToasterProps } from "./toast.types";

export function Toaster({ className }: ToasterProps) {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2",
        className,
      )}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}
