import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api/with-api-error-handling";
import { logServerError } from "@/lib/monitoring/error-logger";

const errorPayloadSchema = z.object({
  timestamp: z.string().optional(),
  message: z.string().min(1),
  stack: z.string().nullable().optional(),
  context: z.object({
    area: z.string().min(1),
    userId: z.string().nullable().optional(),
    agencyId: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
});

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const body = await request.json();
    const parsed = errorPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid error payload."
        },
        { status: 400 }
      );
    }

    await logServerError(new Error(parsed.data.message), {
      area: `client/${parsed.data.context.area}`,
      userId: parsed.data.context.userId,
      agencyId: parsed.data.context.agencyId,
      metadata: {
        stack: parsed.data.stack ?? null,
        timestamp: parsed.data.timestamp ?? null,
        ...(parsed.data.context.metadata ?? {})
      }
    });

    return NextResponse.json({ ok: true });
  }, "api/errors");
}
