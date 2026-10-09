import type { NextRequest } from "next/server";
import { z } from "zod";

import { submitDecision } from "@/server/hilRegistry";
import { hilDecisionSchema } from "@/types/log.types";

const bodySchema = z.object({ decision: hilDecisionSchema });

/** POST /api/workflows/:id/hil/:requestId  { decision: "approved" | "rejected" } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const { requestId } = await params;
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json(
      { error: "Body must be { decision: 'approved' | 'rejected' }" },
      { status: 400 },
    );
  }

  if (!submitDecision(requestId, body.data.decision)) {
    return Response.json({ error: "No pending HIL request with this id" }, { status: 404 });
  }

  return Response.json({ requestId, decision: body.data.decision });
}
