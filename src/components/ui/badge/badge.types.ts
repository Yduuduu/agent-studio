import type { ComponentPropsWithoutRef } from "react";

export type BadgeStatus = "idle" | "pending" | "running" | "success" | "error";

export interface BadgeProps extends Omit<ComponentPropsWithoutRef<"span">, "color"> {
  status: BadgeStatus;
}
