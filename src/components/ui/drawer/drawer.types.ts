import type { ReactNode } from "react";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  side?: "left" | "right";
}
