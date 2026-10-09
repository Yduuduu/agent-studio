import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  variant?: ToastVariant;
  title: ReactNode;
  description?: ReactNode;
  onDismiss?: () => void;
}

export interface ToasterProps {
  className?: string;
}
