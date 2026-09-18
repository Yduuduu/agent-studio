import { cn } from "@/utils/cn";

import type { BadgeProps, BadgeStatus } from "./badge.types";

const STATUS_CLASSES: Record<BadgeStatus, string> = {
  idle: "bg-gray-100 text-gray-600",
  pending: "bg-amber-100 text-amber-700",
  running: "bg-blue-100 text-blue-700 animate-pulse",
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<BadgeStatus, string> = {
  idle: "Idle",
  pending: "Pending",
  running: "Running",
  success: "Success",
  error: "Error",
};

export function Badge({ status, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "idle" && "bg-gray-400",
          status === "pending" && "bg-amber-500",
          status === "running" && "bg-blue-500",
          status === "success" && "bg-green-500",
          status === "error" && "bg-red-500",
        )}
        aria-hidden="true"
      />
      {children ?? STATUS_LABEL[status]}
    </span>
  );
}
