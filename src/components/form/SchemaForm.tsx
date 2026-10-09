import { memo, useCallback, useMemo, type ComponentType } from "react";
import type { Control, FieldValues } from "react-hook-form";
import type { z } from "zod";

import type { UiSchema } from "@/types/form.schema";

import { ArrayField } from "./fields/ArrayField";
import { BooleanField } from "./fields/BooleanField";
import { ConditionalField } from "./fields/ConditionalField";
import { NumberField } from "./fields/NumberField";
import { SelectField } from "./fields/SelectField";
import { TextField } from "./fields/TextField";
import type {
  FieldDescriptor,
  FieldProps,
  LeafFieldDescriptor,
  LeafFieldType,
} from "./schema-form.types";
import { parseSchema } from "./schema-form.utils";

type LeafComponent<T extends LeafFieldType> = ComponentType<
  Extract<LeafFieldDescriptor, { type: T }>["props"] & Pick<FieldProps, "control" | "name">
>;

// Leaf fields resolve through the registry; "object" and "array" are
// structural and handled below because they recurse back into SchemaForm.
const FIELD_REGISTRY: { [T in LeafFieldType]: LeafComponent<T> } = {
  text: TextField,
  number: NumberField,
  boolean: BooleanField,
  select: SelectField,
};

const joinPath = (prefix: string | undefined, key: string) => (prefix ? `${prefix}.${key}` : key);

interface FieldListProps {
  control: Control<FieldValues>;
  fields: FieldDescriptor[];
  namePrefix?: string;
}

const FieldList = memo(function FieldList({ control, fields, namePrefix }: FieldListProps) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((descriptor) => {
        const field = (
          <DescriptorField
            control={control}
            descriptor={descriptor}
            name={joinPath(namePrefix, descriptor.key)}
          />
        );
        return descriptor.condition ? (
          <ConditionalField
            key={descriptor.key}
            control={control}
            dependsOn={joinPath(namePrefix, descriptor.condition.dependsOn)}
            is={descriptor.condition.is}
          >
            {field}
          </ConditionalField>
        ) : (
          <div key={descriptor.key}>{field}</div>
        );
      })}
    </div>
  );
});

interface DescriptorFieldProps {
  control: Control<FieldValues>;
  descriptor: FieldDescriptor;
  name: string;
}

function DescriptorField({ control, descriptor, name }: DescriptorFieldProps) {
  switch (descriptor.type) {
    case "object":
      return (
        <fieldset className="flex flex-col gap-3 rounded-md border border-gray-200 p-3">
          <legend className="px-1 text-xs font-semibold text-gray-700">{descriptor.label}</legend>
          {descriptor.description ? (
            <p className="text-xs text-gray-500">{descriptor.description}</p>
          ) : null}
          <FieldList control={control} fields={descriptor.fields} namePrefix={name} />
        </fieldset>
      );
    case "array":
      return <ArrayDescriptorField control={control} descriptor={descriptor} name={name} />;
    default: {
      // The registry is keyed by descriptor.type, so props always match.
      const Leaf = FIELD_REGISTRY[descriptor.type] as ComponentType<
        typeof descriptor.props & Pick<FieldProps, "control" | "name">
      >;
      return <Leaf control={control} name={name} {...descriptor.props} />;
    }
  }
}

function ArrayDescriptorField({
  control,
  descriptor,
  name,
}: DescriptorFieldProps & { descriptor: Extract<FieldDescriptor, { type: "array" }> }) {
  const { itemFields } = descriptor;
  // Stable so the memoized ArrayField skips re-rendering on parent updates.
  const renderItem = useCallback(
    (itemName: string) => <FieldList control={control} fields={itemFields} namePrefix={itemName} />,
    [control, itemFields],
  );
  return <ArrayField control={control} name={name} renderItem={renderItem} {...descriptor.props} />;
}

export interface SchemaFormProps<S extends z.AnyZodObject> {
  control: Control<FieldValues>;
  schema: S;
  uiSchema?: UiSchema<z.input<S>>;
  /** Dot-path under which this schema's values live in the parent form. */
  namePrefix?: string;
}

/**
 * Renders form fields for a Zod object schema. Owns no form state: the
 * caller creates the form (useForm + zodResolver) and passes `control`.
 */
export function SchemaForm<S extends z.AnyZodObject>({
  control,
  schema,
  uiSchema,
  namePrefix,
}: SchemaFormProps<S>) {
  const fields = useMemo(() => parseSchema(schema, uiSchema), [schema, uiSchema]);
  return <FieldList control={control} fields={fields} namePrefix={namePrefix} />;
}
