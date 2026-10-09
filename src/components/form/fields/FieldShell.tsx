import type { ReactNode } from "react";

interface FieldShellProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  children: ReactNode;
}

/** Label / description / error chrome shared by the leaf field components. */
export function FieldShell({ id, label, description, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-700">
        {label}
      </label>
      {children}
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const CONTROL_CLASSES =
  "w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none";

export const CONTROL_ERROR_CLASSES = "border-red-500 focus:border-red-500 focus:ring-red-500";
