import type { ComponentPropsWithoutRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "color"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}
