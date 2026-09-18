"use client";

import { useEffect } from "react";

import type { ModalProps } from "./modal.types";

export function Modal({ open, onClose, title, children }: ModalProps) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative flex w-full max-w-md flex-col rounded-lg bg-white p-5 shadow-xl">
        {title ? <h2 className="mb-3 text-base font-semibold text-gray-900">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
