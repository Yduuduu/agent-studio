import type { ComponentPropsWithoutRef } from "react";

export interface ProgressBarProps extends ComponentPropsWithoutRef<"div"> {
  value: number;
  max?: number;
}
