import { memo, useId } from "react";
import { Controller } from "react-hook-form";

import { cn } from "@/utils/cn";

import type { TextFieldProps } from "../schema-form.types";
import { CONTROL_CLASSES, CONTROL_ERROR_CLASSES, FieldShell } from "./FieldShell";

function TextFieldComponent({
  control,
  name,
  label,
  description,
  placeholder,
  multiline = false,
}: TextFieldProps) {
  const id = useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const shared = {
          id,
          name: field.name,
          ref: field.ref,
          value: (field.value as string | undefined) ?? "",
          onChange: field.onChange,
          onBlur: field.onBlur,
          placeholder,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? `${id}-error` : undefined,
        };
        const className = cn(CONTROL_CLASSES, error && CONTROL_ERROR_CLASSES);

        return (
          <FieldShell id={id} label={label} description={description} error={error?.message}>
            {multiline ? (
              <textarea {...shared} rows={4} className={cn(className, "py-2")} />
            ) : (
              <input {...shared} type="text" className={cn(className, "h-9")} />
            )}
          </FieldShell>
        );
      }}
    />
  );
}

export const TextField = memo(TextFieldComponent);
