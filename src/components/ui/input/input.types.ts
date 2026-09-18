import type { ComponentPropsWithoutRef } from "react";

export interface InputProps extends Omit<ComponentPropsWithoutRef<"input">, "size"> {
  size?: "sm" | "md" | "lg";
  error?: string;
}
