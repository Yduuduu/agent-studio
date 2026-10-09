import { memo, useId } from "react";
import { Controller } from "react-hook-form";

import type { FieldProps } from "../schema-form.types";

function BooleanFieldComponent({ control, name, label, description }: FieldProps) {
  const id = useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-start gap-2">
          <input
            id={id}
            ref={field.ref}
            name={field.name}
            type="checkbox"
            checked={Boolean(field.value)}
            onChange={(event) => field.onChange(event.target.checked)}
            onBlur={field.onBlur}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex flex-col">
            <label htmlFor={id} className="text-xs font-medium text-gray-700">
              {label}
            </label>
            {description ? <p className="text-xs text-gray-500">{description}</p> : null}
          </div>
        </div>
      )}
    />
  );
}

export const BooleanField = memo(BooleanFieldComponent);
