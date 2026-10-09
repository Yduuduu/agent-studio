import { cn } from "@/utils/cn";

import type { ToastProps, ToastVariant } from "./toast.types";

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

export function Toast({
  variant = "info",
  title,
  description,
  onDismiss,
  className,
  ...props
}: ToastProps) {
  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-3 rounded-lg border px-4 py-3 shadow-md",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="mt-0.5 text-xs opacity-80">{description}</p> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-0.5 opacity-60 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
