import type { ReactNode } from "react";
import type { Control, FieldValues } from "react-hook-form";

/**
 * Props shared by every field in the registry. The form is schema-driven, so
 * `name` is a runtime dot-path (e.g. `retry.policy.maxAttempts`) rather than a
 * statically typed FieldPath. `control` is passed explicitly instead of read
 * from context so each field subscribes only to its own slice of form state.
 */
export interface FieldProps {
  control: Control<FieldValues>;
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
}

export interface TextFieldProps extends FieldProps {
  multiline?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends FieldProps {
  options: SelectOption[];
}

export interface ArrayFieldProps extends FieldProps {
  /** Value appended when the user clicks "Add". */
  newItem: () => unknown;
  /** Renders one item; `itemName` is the item's dot-path prefix (e.g. `rules.2`). */
  renderItem: (itemName: string, index: number) => ReactNode;
  addLabel?: string;
}

export interface ConditionalFieldProps {
  control: Control<FieldValues>;
  /** Full dot-path of the field this one depends on. */
  dependsOn: string;
  is: (value: unknown) => boolean;
  children: ReactNode;
}

interface DescriptorBase {
  /** Key within the enclosing object; SchemaForm prefixes it into a dot-path. */
  key: string;
  /** Present when uiSchema.visibleWhen applies; `dependsOn` is a sibling key. */
  condition?: { dependsOn: string; is: (value: unknown) => boolean };
}

type LeafProps<P extends FieldProps> = Omit<P, "control" | "name">;

export type LeafFieldDescriptor =
  | (DescriptorBase & { type: "text"; props: LeafProps<TextFieldProps> })
  | (DescriptorBase & { type: "number"; props: LeafProps<FieldProps> })
  | (DescriptorBase & { type: "boolean"; props: LeafProps<FieldProps> })
  | (DescriptorBase & { type: "select"; props: LeafProps<SelectFieldProps> });

export type LeafFieldType = LeafFieldDescriptor["type"];

export type FieldDescriptor =
  | LeafFieldDescriptor
  | (DescriptorBase & {
      type: "object";
      label: string;
      description?: string;
      fields: FieldDescriptor[];
    })
  | (DescriptorBase & {
      type: "array";
      props: LeafProps<Omit<ArrayFieldProps, "renderItem">>;
      itemFields: FieldDescriptor[];
    });
