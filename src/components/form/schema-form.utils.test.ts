import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  conditionNodeConfigSchema,
  conditionNodeUiSchema,
  llmNodeConfigSchema,
  llmNodeUiSchema,
} from "@/types/form.schema";

import { buildDefaults, parseSchema } from "./schema-form.utils";

describe("parseSchema", () => {
  const fields = parseSchema(llmNodeConfigSchema, llmNodeUiSchema);
  const byKey = (key: string) => fields.find((field) => field.key === key);

  it("maps Zod types to field types through optional/default wrappers", () => {
    expect(fields.map((field) => [field.key, field.type])).toEqual([
      ["provider", "select"],
      ["model", "text"],
      ["systemPrompt", "text"],
      ["extendedThinking", "boolean"],
      ["temperature", "number"],
      ["retry", "object"],
    ]);
  });

  it("applies uiSchema labels, option labels and multiline hints", () => {
    expect(byKey("provider")).toMatchObject({
      props: {
        label: "Provider",
        options: [
          { value: "anthropic", label: "Anthropic" },
          { value: "openai", label: "OpenAI" },
        ],
      },
    });
    expect(byKey("systemPrompt")).toMatchObject({ props: { multiline: true } });
  });

  it("carries visibleWhen as a sibling-relative condition", () => {
    const condition = byKey("extendedThinking")?.condition;
    expect(condition?.dependsOn).toBe("provider");
    expect(condition?.is("anthropic")).toBe(true);
    expect(condition?.is("openai")).toBe(false);
  });

  it("recurses into nested objects with their own uiSchema", () => {
    const retry = byKey("retry");
    if (retry?.type !== "object") throw new Error("expected object descriptor");
    const policy = retry.fields[0];
    if (policy?.type !== "object") throw new Error("expected nested object descriptor");
    expect(policy.fields.map((field) => field.key)).toEqual(["maxAttempts", "backoff"]);
    expect(policy.fields[0]).toMatchObject({ props: { label: "Max attempts" } });
  });

  it("describes arrays of objects with item fields and a default new item", () => {
    const [rules] = parseSchema(conditionNodeConfigSchema, conditionNodeUiSchema);
    if (rules?.type !== "array") throw new Error("expected array descriptor");
    expect(rules.itemFields.map((field) => field.key)).toEqual(["field", "operator", "value"]);
    expect(rules.props.newItem()).toEqual({ field: "", operator: "equals", value: "" });
  });

  it("falls back to a humanized key when no label is given", () => {
    const [field] = parseSchema(z.object({ maxTokens: z.number() }));
    expect(field).toMatchObject({ props: { label: "Max tokens" } });
  });

  it("throws on unsupported schema types", () => {
    expect(() => parseSchema(z.object({ when: z.date() }))).toThrow(/unsupported/);
  });
});

describe("buildDefaults", () => {
  it("honors .default() and fills primitives", () => {
    expect(buildDefaults(llmNodeConfigSchema)).toEqual({
      provider: "anthropic",
      model: "",
      systemPrompt: undefined,
      extendedThinking: undefined,
      temperature: 1,
      retry: { policy: { maxAttempts: 3, backoff: "exponential" } },
    });
  });
});
