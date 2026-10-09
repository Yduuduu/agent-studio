import { z } from "zod";

import { nodeStatusSchema } from "./node.schema";

// Wire format of the workflow run SSE stream. Every message is parsed with
// streamEventSchema so a malformed server payload can never reach the stores.

export const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);
export type LogLevel = z.infer<typeof logLevelSchema>;

export const logEventSchema = z.object({
  type: z.literal("log"),
  id: z.string(),
  timestamp: z.number(),
  level: logLevelSchema,
  message: z.string(),
  nodeId: z.string().optional(),
});
export type LogEvent = z.infer<typeof logEventSchema>;

export const hilRequestEventSchema = z.object({
  type: z.literal("hil_request"),
  id: z.string(),
  timestamp: z.number(),
  requestId: z.string(),
  message: z.string(),
  nodeId: z.string().optional(),
});
export type HILRequestEvent = z.infer<typeof hilRequestEventSchema>;

export const nodeStatusEventSchema = z.object({
  type: z.literal("node_status"),
  nodeId: z.string(),
  status: nodeStatusSchema,
  progress: z.number().min(0).max(100).optional(),
});
export type NodeStatusEvent = z.infer<typeof nodeStatusEventSchema>;

export const streamEventSchema = z.discriminatedUnion("type", [
  logEventSchema,
  hilRequestEventSchema,
  nodeStatusEventSchema,
]);
export type StreamEvent = z.infer<typeof streamEventSchema>;

/** Client-side lifecycle of a HIL request in the log viewer. */
export type HILResolution = "pending" | "approved" | "rejected";

export type HILLogEntry = HILRequestEvent & { resolution: HILResolution };

/** What the log viewer renders: plain log lines plus HIL requests with local state. */
export type LogEntry = LogEvent | HILLogEntry;
