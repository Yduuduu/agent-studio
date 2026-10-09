import { z } from "zod";

import type { WorkflowNodeKind } from "./node.schema";

// ---------------------------------------------------------------------------
// Node config schemas — validation only. Rendering hints live in the
// uiSchema objects below so presentation rules never leak into validation.
// ---------------------------------------------------------------------------

export const retryConfigSchema = z.object({
  policy: z.object({
    maxAttempts: z.number().int().min(1).max(10).default(3),
    backoff: z.enum(["fixed", "exponential"]).default("exponential"),
  }),
});

export const llmNodeConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string().min(1, "Model is required"),
  systemPrompt: z.string().optional(),
  // Only meaningful for provider === "anthropic" (see llmNodeUiSchema).
  extendedThinking: z.boolean().optional(),
  temperature: z.number().min(0).max(2).default(1),
  retry: retryConfigSchema,
});
export type LLMNodeConfig = z.infer<typeof llmNodeConfigSchema>;
export type LLMNodeConfigInput = z.input<typeof llmNodeConfigSchema>;

export const dbQueryNodeConfigSchema = z.object({
  connectionId: z.string().min(1, "Connection is required"),
  query: z.string().min(1, "Query is required"),
  timeoutMs: z.number().int().positive().default(5000),
  retry: retryConfigSchema,
});
export type DBQueryNodeConfig = z.infer<typeof dbQueryNodeConfigSchema>;
export type DBQueryNodeConfigInput = z.input<typeof dbQueryNodeConfigSchema>;

export const conditionOperatorSchema = z.enum(["equals", "contains", "greaterThan", "lessThan"]);

export const conditionRuleSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: conditionOperatorSchema,
  value: z.string().min(1, "Value is required"),
});

export const conditionNodeConfigSchema = z.object({
  rules: z.array(conditionRuleSchema).min(1, "Add at least one rule"),
  combinator: z.enum(["and", "or"]).default("and"),
});
export type ConditionNodeConfig = z.infer<typeof conditionNodeConfigSchema>;
export type ConditionNodeConfigInput = z.input<typeof conditionNodeConfigSchema>;

// ---------------------------------------------------------------------------
// uiSchema — presentation metadata keyed to mirror the schema shape.
// Nested objects describe their children under `fields`, arrays of objects
// describe each item under `items` (SchemaForm recurses into both).
// ---------------------------------------------------------------------------

/**
 * Shows a field only when a sibling field's value satisfies `is`. `dependsOn`
 * is relative to the enclosing object, so ConditionalField can resolve the
 * full dot-path (e.g. `rules.2.operator`) from its own position.
 */
export type VisibleWhen<T> = {
  [K in keyof T & string]: { dependsOn: K; is: (value: T[K]) => boolean };
}[keyof T & string];

export interface FieldUi<TParent> {
  label?: string;
  description?: string;
  placeholder?: string;
  /** Renders a string field as a multi-line textarea. */
  multiline?: boolean;
  /** Human-readable labels for enum options; falls back to the raw value. */
  optionLabels?: Record<string, string>;
  visibleWhen?: VisibleWhen<TParent>;
}

type NestedUi<V> =
  NonNullable<V> extends readonly (infer Item)[]
    ? Item extends object
      ? { items?: UiSchema<Item> }
      : unknown
    : NonNullable<V> extends object
      ? { fields?: UiSchema<NonNullable<V>> }
      : unknown;

export type UiSchema<T> = {
  [K in keyof T]?: FieldUi<T> & NestedUi<T[K]>;
};

export function isFieldVisible<T>(ui: FieldUi<T> | undefined, values: NoInfer<T>): boolean {
  if (!ui?.visibleWhen) return true;
  const { dependsOn, is } = ui.visibleWhen;
  return is(values[dependsOn]);
}

const retryUiSchema: UiSchema<z.input<typeof retryConfigSchema>> = {
  policy: {
    label: "Retry policy",
    fields: {
      maxAttempts: { label: "Max attempts" },
      backoff: {
        label: "Backoff",
        optionLabels: { fixed: "Fixed interval", exponential: "Exponential" },
      },
    },
  },
};

export const llmNodeUiSchema: UiSchema<LLMNodeConfigInput> = {
  provider: {
    label: "Provider",
    optionLabels: { anthropic: "Anthropic", openai: "OpenAI" },
  },
  model: { label: "Model", placeholder: "e.g. claude-opus-5-5" },
  systemPrompt: { label: "System prompt", multiline: true },
  extendedThinking: {
    label: "Extended thinking",
    visibleWhen: { dependsOn: "provider", is: (provider) => provider === "anthropic" },
  },
  temperature: { label: "Temperature", description: "0 = deterministic, 2 = most random" },
  retry: { label: "Retry", fields: retryUiSchema },
};

export const dbQueryNodeUiSchema: UiSchema<DBQueryNodeConfigInput> = {
  connectionId: { label: "Connection", placeholder: "e.g. analytics-replica" },
  query: { label: "Query", multiline: true, placeholder: "SELECT * FROM users WHERE id = :id" },
  timeoutMs: { label: "Timeout (ms)" },
  retry: { label: "Retry", fields: retryUiSchema },
};

export const conditionNodeUiSchema: UiSchema<ConditionNodeConfigInput> = {
  rules: {
    label: "Rules",
    items: {
      field: { label: "Field", placeholder: "e.g. output.score" },
      operator: {
        label: "Operator",
        optionLabels: {
          equals: "equals",
          contains: "contains",
          greaterThan: "greater than",
          lessThan: "less than",
        },
      },
      value: { label: "Value" },
    },
  },
  combinator: {
    label: "Match",
    optionLabels: { and: "All rules (AND)", or: "Any rule (OR)" },
  },
};

// ---------------------------------------------------------------------------
// Registry — what the node settings Drawer looks up by node kind.
// ---------------------------------------------------------------------------

export interface NodeConfigForm<S extends z.ZodTypeAny> {
  schema: S;
  uiSchema: UiSchema<z.input<S>>;
  defaultValues: z.input<S>;
}

const DEFAULT_RETRY = { policy: { maxAttempts: 3, backoff: "exponential" } } as const;

export const NODE_CONFIG_FORMS = {
  llm: {
    schema: llmNodeConfigSchema,
    uiSchema: llmNodeUiSchema,
    defaultValues: {
      provider: "anthropic",
      model: "",
      systemPrompt: "",
      extendedThinking: false,
      temperature: 1,
      retry: DEFAULT_RETRY,
    },
  } satisfies NodeConfigForm<typeof llmNodeConfigSchema>,
  "db-query": {
    schema: dbQueryNodeConfigSchema,
    uiSchema: dbQueryNodeUiSchema,
    defaultValues: { connectionId: "", query: "", timeoutMs: 5000, retry: DEFAULT_RETRY },
  } satisfies NodeConfigForm<typeof dbQueryNodeConfigSchema>,
  condition: {
    schema: conditionNodeConfigSchema,
    uiSchema: conditionNodeUiSchema,
    defaultValues: {
      rules: [{ field: "", operator: "equals", value: "" }],
      combinator: "and",
    },
  } satisfies NodeConfigForm<typeof conditionNodeConfigSchema>,
} satisfies Record<WorkflowNodeKind, NodeConfigForm<z.ZodTypeAny>>;

export type NodeConfigByKind = {
  [K in WorkflowNodeKind]: z.infer<(typeof NODE_CONFIG_FORMS)[K]["schema"]>;
};
