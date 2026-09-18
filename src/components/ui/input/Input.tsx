import { forwardRef, useId } from "react";

import { cn } from "@/utils/cn";

import type { InputProps } from "./input.types";

const SIZE_CLASSES: Record<NonNullable<InputProps["size"]>, string> = {
  sm: "h-8 px-2.5 text-sm",
  md: "h-9 px-3 text-sm",
  lg: "h-11 px-4 text-base",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, size = "md", error, id, "aria-describedby": describedBy, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={cn(errorId, describedBy) || undefined}
        className={cn(
          "w-full rounded-md border border-gray-300 bg-white text-gray-900 shadow-sm",
          "placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
});
