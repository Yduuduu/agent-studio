import type { HILDecision } from "@/types/log.types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(payload?.error ?? `Request failed (${response.status})`, response.status);
  }
  return response.json() as Promise<unknown>;
}

export function submitHILDecision(workflowId: string, requestId: string, decision: HILDecision) {
  return postJson(
    `/api/workflows/${encodeURIComponent(workflowId)}/hil/${encodeURIComponent(requestId)}`,
    { decision },
  );
}
