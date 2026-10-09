import { memo } from "react";
import { get, useFieldArray, useFormState } from "react-hook-form";

import { Button } from "@/components/ui/button/Button";

import type { ArrayFieldProps } from "../schema-form.types";

function ArrayFieldComponent({
  control,
  name,
  label,
  description,
  newItem,
  renderItem,
  addLabel = "Add item",
}: ArrayFieldProps) {
  const { fields, append, remove } = useFieldArray({ control, name });
  // Subscribe to this array's errors only, not the whole form's.
  const { errors } = useFormState({ control, name });
  const arrayError = get(errors, name) as { message?: string; root?: { message?: string } };
  const message = arrayError?.root?.message ?? arrayError?.message;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-xs font-medium text-gray-700">{label}</legend>
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}

      {fields.map((item, index) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-3"
        >
          {renderItem(`${name}.${index}`, index)}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-end"
            onClick={() => remove(index)}
            aria-label={`Remove ${label} ${index + 1}`}
          >
            Remove
          </Button>
        </div>
      ))}

      {message ? <p className="text-xs text-red-600">{message}</p> : null}

      <Button type="button" variant="secondary" size="sm" onClick={() => append(newItem())}>
        {addLabel}
      </Button>
    </fieldset>
  );
}

export const ArrayField = memo(ArrayFieldComponent);
