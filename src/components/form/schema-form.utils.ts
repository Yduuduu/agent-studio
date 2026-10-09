import { z } from "zod";

import type { FieldUi, UiSchema } from "@/types/form.schema";

import type { FieldDescriptor } from "./schema-form.types";

type AnyObjectSchema = z.ZodObject<z.ZodRawShape>;

/** Strips optional / nullable / default / effects wrappers to the core type. */
export function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return unwrapSchema(schema.unwrap());
  }
  if (schema instanceof z.ZodDefault) return unwrapSchema(schema._def.innerType);
  if (schema instanceof z.ZodEffects) return unwrapSchema(schema.innerType());
  return schema;
}

/** Builds an initial value for `schema`, honoring `.default()` where present. */
export function buildDefaults(schema: z.ZodTypeAny): unknown {
  if (schema instanceof z.ZodDefault) return schema._def.defaultValue();
  if (schema instanceof z.ZodOptional) return undefined;

  const core = unwrapSchema(schema);
  if (core instanceof z.ZodObject) {
    return Object.fromEntries(
      Object.entries((core as AnyObjectSchema).shape).map(([key, child]) => [
        key,
        buildDefaults(child),
      ]),
    );
  }
  if (core instanceof z.ZodString) return "";
  if (core instanceof z.ZodBoolean) return false;
  if (core instanceof z.ZodEnum) return (core.options as string[])[0];
  if (core instanceof z.ZodArray) return [];
  return undefined;
}

function humanize(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Maps a Zod object schema (+ optional uiSchema) to render descriptors.
 * Pure and deterministic: SchemaForm memoizes the result per schema, so the
 * functions and arrays it creates stay referentially stable across renders.
 */
export function parseSchema<T>(
  schema: AnyObjectSchema,
  uiSchema: UiSchema<T> = {},
): FieldDescriptor[] {
  const descriptors: FieldDescriptor[] = [];

  for (const [key, child] of Object.entries(schema.shape)) {
    const ui = (uiSchema as Record<string, FieldUi<T> & Record<string, unknown>>)[key] ?? {};
    const core = unwrapSchema(child);
    const label = ui.label ?? humanize(key);
    const shared = { label, description: ui.description, placeholder: ui.placeholder };
    const condition = ui.visibleWhen
      ? {
          dependsOn: ui.visibleWhen.dependsOn,
          is: ui.visibleWhen.is as (value: unknown) => boolean,
        }
      : undefined;

    if (core instanceof z.ZodString) {
      descriptors.push({
        key,
        condition,
        type: "text",
        props: { ...shared, multiline: ui.multiline },
      });
    } else if (core instanceof z.ZodNumber) {
      descriptors.push({ key, condition, type: "number", props: shared });
    } else if (core instanceof z.ZodBoolean) {
      descriptors.push({ key, condition, type: "boolean", props: shared });
    } else if (core instanceof z.ZodEnum) {
      const options = (core.options as string[]).map((value) => ({
        value,
        label: ui.optionLabels?.[value] ?? value,
      }));
      descriptors.push({ key, condition, type: "select", props: { ...shared, options } });
    } else if (core instanceof z.ZodObject) {
      descriptors.push({
        key,
        condition,
        type: "object",
        label,
        description: ui.description,
        fields: parseSchema(core as AnyObjectSchema, (ui.fields ?? {}) as UiSchema<unknown>),
      });
    } else if (core instanceof z.ZodArray && unwrapSchema(core.element) instanceof z.ZodObject) {
      const itemSchema = unwrapSchema(core.element) as AnyObjectSchema;
      descriptors.push({
        key,
        condition,
        type: "array",
        props: {
          label,
          description: ui.description,
          addLabel: `Add ${label.toLowerCase().replace(/s$/, "")}`,
          newItem: () => buildDefaults(itemSchema),
        },
        itemFields: parseSchema(itemSchema, (ui.items ?? {}) as UiSchema<unknown>),
      });
    } else {
      throw new Error(`parseSchema: unsupported schema type for "${key}"`);
    }
  }

  return descriptors;
}
