import { memo, useCallback } from "react";

import { Button } from "@/components/ui/button/Button";
import { useLogStore } from "@/store/useLogStore";
import { useToastStore } from "@/store/useToastStore";
import type { HILDecision, HILLogEntry } from "@/types/log.types";
import { cn } from "@/utils/cn";

interface HILApprovalBarProps {
  entry: HILLogEntry;
}

function HILApprovalBarComponent({ entry }: HILApprovalBarProps) {
  const { workflowId, requestId, resolution } = entry;
  const decideHIL = useLogStore((state) => state.decideHIL);

  const decide = useCallback(
    async (decision: HILDecision) => {
      try {
        await decideHIL(workflowId, requestId, decision);
      } catch (error) {
        useToastStore.getState().show({
          variant: "error",
          title: `Could not ${decision === "approved" ? "approve" : "reject"} request`,
          description: error instanceof Error ? error.message : undefined,
        });
      }
    },
    [decideHIL, workflowId, requestId],
  );

  if (resolution !== "pending") {
    return (
      <p
        className={cn(
          "mt-1 font-sans text-xs font-medium",
          resolution === "approved" ? "text-green-700" : "text-red-700",
        )}
      >
        {resolution === "approved" ? "✓ Approved" : "✕ Rejected"}
      </p>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 font-sans" role="group" aria-label="HIL decision">
      <Button size="sm" onClick={() => void decide("approved")}>
        Approve
      </Button>
      <Button size="sm" variant="secondary" onClick={() => void decide("rejected")}>
        Reject
      </Button>
      <span className="text-xs text-gray-500">The run is paused until you decide.</span>
    </div>
  );
}

export const HILApprovalBar = memo(HILApprovalBarComponent);
