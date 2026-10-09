import { memo, useId } from "react";
import { Controller } from "react-hook-form";

import { cn } from "@/utils/cn";

import type { SelectFieldProps } from "../schema-form.types";
import { CONTROL_CLASSES, CONTROL_ERROR_CLASSES, FieldShell } from "./FieldShell";

function SelectFieldComponent({
  control,
  name,
  label,
  description,
  placeholder,
  options,
}: SelectFieldProps) {
  const id = useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <FieldShell id={id} label={label} description={description} error={error?.message}>
          <select
            id={id}
            ref={field.ref}
            name={field.name}
            value={(field.value as string | undefined) ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(CONTROL_CLASSES, "h-9", error && CONTROL_ERROR_CLASSES)}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>
      )}
    />
  );
}

export const SelectField = memo(SelectFieldComponent);
