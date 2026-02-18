import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api/with-api-error-handling";

const telemetrySchema = z.object({
  kind: z.enum(["web_vital"]),
  name: z.string().min(1),
  value: z.number(),
  path: z.string().min(1)
});

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const body = await request.json();
    const parsed = telemetrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid telemetry payload." }, { status: 400 });
    }

    const payload = {
      ...parsed.data,
      receivedAt: new Date().toISOString()
    };

    console.log("[telemetry]", payload);

    const telemetryWebhook = process.env.TELEMETRY_WEBHOOK_URL?.trim();
    if (telemetryWebhook && process.env.NODE_ENV === "production") {
      await fetch(telemetryWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        cache: "no-store"
      });
    }

    return NextResponse.json({ ok: true });
  }, "api/telemetry#post");
}
