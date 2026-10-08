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
