import { z } from "zod";

export const nodeStatusSchema = z.enum(["idle", "pending", "running", "success", "error"]);
export type NodeStatus = z.infer<typeof nodeStatusSchema>;

export const workflowNodeKindSchema = z.enum(["llm", "db-query", "condition"]);
export type WorkflowNodeKind = z.infer<typeof workflowNodeKindSchema>;

export const baseNodeDataSchema = z.object({
  label: z.string().min(1, "Label is required"),
  kind: workflowNodeKindSchema,
  status: nodeStatusSchema.default("idle"),
  progress: z.number().min(0).max(100).optional(),
});
export type BaseNodeData = z.infer<typeof baseNodeDataSchema>;

export const llmNodeConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string().min(1),
  systemPrompt: z.string().optional(),
  extendedThinking: z.boolean().optional(),
  temperature: z.number().min(0).max(2).default(1),
});
export type LLMNodeConfig = z.infer<typeof llmNodeConfigSchema>;

export const dbQueryNodeConfigSchema = z.object({
  connectionId: z.string().min(1),
  query: z.string().min(1),
  timeoutMs: z.number().int().positive().default(5000),
});
export type DBQueryNodeConfig = z.infer<typeof dbQueryNodeConfigSchema>;

export const conditionOperatorSchema = z.enum(["equals", "contains", "greaterThan", "lessThan"]);

export const conditionNodeConfigSchema = z.object({
  rules: z
    .array(
      z.object({
        field: z.string().min(1),
        operator: conditionOperatorSchema,
        value: z.string().min(1),
      }),
    )
    .min(1),
});
export type ConditionNodeConfig = z.infer<typeof conditionNodeConfigSchema>;
