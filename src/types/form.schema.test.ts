import { describe, expect, it } from "vitest";

import {
  conditionNodeConfigSchema,
  isFieldVisible,
  llmNodeConfigSchema,
  llmNodeUiSchema,
  NODE_CONFIG_FORMS,
  type LLMNodeConfigInput,
} from "./form.schema";

const validLLM: LLMNodeConfigInput = {
  provider: "anthropic",
  model: "claude-opus-5-5",
  retry: { policy: {} },
};

describe("llmNodeConfigSchema", () => {
  it("fills defaults for temperature and nested retry policy", () => {
    const parsed = llmNodeConfigSchema.parse(validLLM);
    expect(parsed.temperature).toBe(1);
    expect(parsed.retry.policy).toEqual({ maxAttempts: 3, backoff: "exponential" });
  });

  it("reports deeply nested errors by dot-path", () => {
    const result = llmNodeConfigSchema.safeParse({
      ...validLLM,
      retry: { policy: { maxAttempts: 0 } },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path.join(".")).toBe("retry.policy.maxAttempts");
  });
});

describe("conditionNodeConfigSchema", () => {
  it("requires at least one rule", () => {
    expect(conditionNodeConfigSchema.safeParse({ rules: [] }).success).toBe(false);
  });
});

describe("llmNodeUiSchema visibility", () => {
  const ui = llmNodeUiSchema.extendedThinking;

  it("shows extendedThinking only for the anthropic provider", () => {
    expect(isFieldVisible(ui, { ...validLLM, provider: "anthropic" })).toBe(true);
    expect(isFieldVisible(ui, { ...validLLM, provider: "openai" })).toBe(false);
  });

  it("treats fields without visibleWhen as always visible", () => {
    expect(isFieldVisible(llmNodeUiSchema.model, validLLM)).toBe(true);
  });
});

describe("NODE_CONFIG_FORMS", () => {
  it("only lists uiSchema keys that exist in the schema", () => {
    for (const { schema, uiSchema } of Object.values(NODE_CONFIG_FORMS)) {
      const schemaKeys = Object.keys(schema.shape);
      expect(schemaKeys).toEqual(expect.arrayContaining(Object.keys(uiSchema)));
    }
  });

  it("condition defaults are valid once the user fills required text", () => {
    const { schema, defaultValues } = NODE_CONFIG_FORMS.condition;
    const filled = {
      ...defaultValues,
      rules: defaultValues.rules.map((rule) => ({ ...rule, field: "score", value: "1" })),
    };
    expect(schema.safeParse(filled).success).toBe(true);
  });
});
