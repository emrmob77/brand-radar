import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api/with-api-error-handling";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const webhookPayloadSchema = z.object({
  agencyId: z.string().uuid().optional(),
  event: z.enum(["mention.created", "citation.created"]),
  clientId: z.string().uuid(),
  platformSlug: z.string().trim().min(2),
  detectedAt: z.string().datetime().optional(),
  data: z.record(z.string(), z.unknown())
});

const mentionDataSchema = z.object({
  query: z.string().trim().min(3),
  content: z.string().trim().min(3),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  sentimentScore: z.number().min(-1).max(1).optional()
});

const citationDataSchema = z.object({
  query: z.string().trim().min(3),
  sourceUrl: z.string().url(),
  sourceType: z.enum(["wikipedia", "reddit", "review_site", "news", "blog", "other"]),
  authorityScore: z.number().int().min(0).max(100).optional()
});

function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    const webhookSecret = process.env.WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      return NextResponse.json({ ok: false, error: "WEBHOOK_SECRET is not configured." }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-brand-radar-signature");
    let payload: unknown = null;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
    }

    const signatureValid = verifySignature(rawBody, signature, webhookSecret);
    const supabase = createServiceRoleSupabaseClient();
    const eventInsert = await supabase
      .from("webhook_events")
      .insert({
        source: "ai_monitoring",
        event_type: typeof (payload as { event?: unknown })?.event === "string" ? (payload as { event: string }).event : "unknown",
        signature_valid: signatureValid,
        payload: payload as Record<string, unknown>
      })
      .select("id")
      .maybeSingle();

    const eventId = eventInsert.data?.id ?? null;

    if (!signatureValid) {
      if (eventId) {
        await supabase
          .from("webhook_events")
          .update({
            error_message: "Invalid webhook signature."
          })
          .eq("id", eventId);
      }
      return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
    }

    const parsed = webhookPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      if (eventId) {
        await supabase
          .from("webhook_events")
          .update({
            error_message: parsed.error.issues[0]?.message ?? "Validation failed."
          })
          .eq("id", eventId);
      }
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    const [clientResult, platformResult] = await Promise.all([
      supabase.from("clients").select("id,agency_id").eq("id", parsed.data.clientId).maybeSingle(),
      supabase.from("platforms").select("id").eq("slug", parsed.data.platformSlug).maybeSingle()
    ]);

    if (clientResult.error || !clientResult.data) {
      if (eventId) {
        await supabase.from("webhook_events").update({ error_message: "Client not found." }).eq("id", eventId);
      }
      return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
    }

    if (parsed.data.agencyId && parsed.data.agencyId !== clientResult.data.agency_id) {
      if (eventId) {
        await supabase.from("webhook_events").update({ error_message: "Agency mismatch." }).eq("id", eventId);
      }
      return NextResponse.json({ ok: false, error: "Agency mismatch." }, { status: 400 });
    }

    if (platformResult.error || !platformResult.data) {
      if (eventId) {
        await supabase.from("webhook_events").update({ error_message: "Platform not found." }).eq("id", eventId);
      }
      return NextResponse.json({ ok: false, error: "Platform not found." }, { status: 404 });
    }

    let createdId: string | null = null;

    if (parsed.data.event === "mention.created") {
      const mentionParsed = mentionDataSchema.safeParse(parsed.data.data);
      if (!mentionParsed.success) {
        if (eventId) {
          await supabase.from("webhook_events").update({ error_message: "Invalid mention payload." }).eq("id", eventId);
        }
        return NextResponse.json({ ok: false, error: "Invalid mention payload." }, { status: 400 });
      }

      const insert = await supabase
        .from("mentions")
        .insert({
          client_id: parsed.data.clientId,
          platform_id: platformResult.data.id,
          query: mentionParsed.data.query,
          content: mentionParsed.data.content,
          sentiment: mentionParsed.data.sentiment,
          sentiment_score: mentionParsed.data.sentimentScore ?? null,
          detected_at: parsed.data.detectedAt ?? new Date().toISOString()
        })
        .select("id")
        .maybeSingle();

      if (insert.error || !insert.data) {
        if (eventId) {
          await supabase
            .from("webhook_events")
            .update({ error_message: insert.error?.message ?? "Mention insert failed." })
            .eq("id", eventId);
        }
        return NextResponse.json({ ok: false, error: insert.error?.message ?? "Mention insert failed." }, { status: 500 });
      }
      createdId = insert.data.id;
    } else {
      const citationParsed = citationDataSchema.safeParse(parsed.data.data);
      if (!citationParsed.success) {
        if (eventId) {
          await supabase.from("webhook_events").update({ error_message: "Invalid citation payload." }).eq("id", eventId);
        }
        return NextResponse.json({ ok: false, error: "Invalid citation payload." }, { status: 400 });
      }

      const insert = await supabase
        .from("citations")
        .insert({
          client_id: parsed.data.clientId,
          platform_id: platformResult.data.id,
          query: citationParsed.data.query,
          source_url: citationParsed.data.sourceUrl,
          source_type: citationParsed.data.sourceType,
          authority_score: citationParsed.data.authorityScore ?? null,
          detected_at: parsed.data.detectedAt ?? new Date().toISOString()
        })
        .select("id")
        .maybeSingle();

      if (insert.error || !insert.data) {
        if (eventId) {
          await supabase
            .from("webhook_events")
            .update({ error_message: insert.error?.message ?? "Citation insert failed." })
            .eq("id", eventId);
        }
        return NextResponse.json({ ok: false, error: insert.error?.message ?? "Citation insert failed." }, { status: 500 });
      }
      createdId = insert.data.id;
    }

    if (eventId) {
      await supabase
        .from("webhook_events")
        .update({
          agency_id: clientResult.data.agency_id,
          processed: true,
          processed_at: new Date().toISOString(),
          error_message: null
        })
        .eq("id", eventId);
    }

    return NextResponse.json({
      ok: true,
      eventId,
      createdId
    });
  }, "api/v1/webhooks/ai-monitoring#post");
}
