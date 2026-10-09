import { memo, useId, useState } from "react";
import { useController } from "react-hook-form";

import { cn } from "@/utils/cn";

import type { FieldProps } from "../schema-form.types";
import { CONTROL_CLASSES, CONTROL_ERROR_CLASSES, FieldShell } from "./FieldShell";

function NumberFieldComponent({ control, name, label, description, placeholder }: FieldProps) {
  const id = useId();
  const {
    field: { ref, value: fieldValue, onChange, onBlur },
    fieldState: { error },
  } = useController({ control, name });
  // Raw text while the user is typing. Without it, clearing the input stores
  // undefined, useController falls back to the default value, and the next
  // keystroke is appended to that default ("3" + "5" = 35).
  const [draft, setDraft] = useState<string | null>(null);
  const value = (fieldValue as number | undefined) ?? "";

  return (
    <FieldShell id={id} label={label} description={description} error={error?.message}>
      <input
        id={id}
        ref={ref}
        name={name}
        type="number"
        inputMode="decimal"
        value={draft ?? value}
        onChange={(event) => {
          setDraft(event.target.value);
          // Empty input becomes undefined so Zod defaults / required checks apply.
          onChange(event.target.value === "" ? undefined : event.target.valueAsNumber);
        }}
        onBlur={() => {
          setDraft(null);
          onBlur();
        }}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL_CLASSES, "h-9", error && CONTROL_ERROR_CLASSES)}
      />
    </FieldShell>
  );
}

export const NumberField = memo(NumberFieldComponent);
