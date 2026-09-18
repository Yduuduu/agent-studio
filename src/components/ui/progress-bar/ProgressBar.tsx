import type { CSSProperties } from "react";

import { cn } from "@/utils/cn";

import type { ProgressBarProps } from "./progress-bar.types";

export function ProgressBar({ value, max = 100, className, ...props }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = Math.round((clamped / max) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-gray-200", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full w-(--progress) rounded-full bg-blue-600 transition-[width] duration-200 ease-out",
        )}
        style={{ "--progress": `${percent}%` } as CSSProperties}
      />
    </div>
  );
}
