"use client";

import { useEffect } from "react";

import { cn } from "@/utils/cn";

import type { DrawerProps } from "./drawer.types";

export function Drawer({ open, onClose, title, children, side = "right" }: DrawerProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute top-0 h-full w-full max-w-md bg-white shadow-xl",
          "flex flex-col",
          side === "right" ? "right-0" : "left-0",
        )}
      >
        {title ? (
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
