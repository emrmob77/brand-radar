"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const exportFormatSchema = z.enum(["csv", "json", "pdf"]);
export const exportScopeSchema = z.enum([
  "overview",
  "mentions",
  "citations",
  "alerts",
  "competitors",
  "trends",
  "visibility",
  "hallucinations",
  "optimizations",
  "clients"
]);

const requestExportSchema = z.object({
  format: exportFormatSchema,
  scope: exportScopeSchema,
  clientId: z.string().uuid().nullable().optional()
});

type ExportFormat = z.infer<typeof exportFormatSchema>;
type ExportScope = z.infer<typeof exportScopeSchema>;

type ExportRow = Record<string, unknown>;

export type RequestExportInput = {
  format: ExportFormat;
  scope: ExportScope;
  clientId?: string | null;
};

export type RequestExportResult =
  | {
      ok: true;
      fileName: string;
      mimeType: string;
      contentBase64: string;
      rowCount: number;
    }
  | {
      ok: false;
      error: string;
    };

function normalizeRows(rows: ExportRow[]): ExportRow[] {
  return rows.map((row) => {
    const normalized: ExportRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (Array.isArray(value)) {
        normalized[key] = value.length === 1 && typeof value[0] === "object" && value[0] !== null ? value[0] : value;
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
  });
}

function serializeCsv(rows: ExportRow[]): string {
  if (rows.length === 0) {
    return "no_data\n";
  }

  const headerSet = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      headerSet.add(key);
    }
  }
  const headers = Array.from(headerSet);

  const escapeCell = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${raw.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.map((header) => `"${header.replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))
  ];

  return lines.join("\n");
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]): Buffer {
  const renderedLines = lines.slice(0, 42);
  const stream = renderedLines
    .map((line, index) => {
      const y = 760 - index * 16;
      return `BT /F1 11 Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`;
    })
    .join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream\nendobj\n`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

function asBase64(value: string | Buffer) {
  return Buffer.isBuffer(value) ? value.toString("base64") : Buffer.from(value, "utf8").toString("base64");
}

function mapScopeToTitle(scope: ExportScope): string {
  if (scope === "overview") return "Executive Dashboard";
  if (scope === "mentions") return "Brand Mentions";
  if (scope === "citations") return "Citation Forensics";
  if (scope === "alerts") return "Alerts and Notifications";
  if (scope === "competitors") return "Competitor Intelligence";
  if (scope === "trends") return "Historical Trends";
  if (scope === "visibility") return "AI Visibility";
  if (scope === "hallucinations") return "Hallucination Detection";
  if (scope === "optimizations") return "Content Optimizations";
  return "Clients";
}

async function loadScopeRows(
  scope: ExportScope,
  clientId: string | null,
  accessToken: string,
  agencyId: string
): Promise<{ rows: ExportRow[] } | { error: string }> {
  const supabase = createServerSupabaseClient(accessToken);

  if (scope === "clients") {
    let query = supabase
      .from("clients")
      .select("id,name,domain,industry,health_score,active_platforms,created_at,updated_at")
      .eq("agency_id", agencyId)
      .order("name", { ascending: true })
      .limit(1000);

    if (clientId) {
      query = query.eq("id", clientId);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { rows: data ?? [] };
  }

  if (scope === "mentions" || scope === "visibility" || scope === "trends" || scope === "overview") {
    let query = supabase
      .from("mentions")
      .select("id,client_id,platform_id,query,sentiment,sentiment_score,detected_at,created_at")
      .order("detected_at", { ascending: false })
      .limit(2000);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { rows: data ?? [] };
  }

  if (scope === "citations") {
    let query = supabase
      .from("citations")
      .select("id,client_id,platform_id,query,source_url,source_type,authority_score,status,detected_at,created_at")
      .order("detected_at", { ascending: false })
      .limit(2000);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { rows: data ?? [] };
  }

  if (scope === "alerts") {
    let query = supabase
      .from("alerts")
      .select("id,client_id,title,message,severity,read,created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { rows: data ?? [] };
  }

  if (scope === "competitors") {
    let query = supabase
      .from("competitors")
      .select("id,client_id,name,domain,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { rows: data ?? [] };
  }

  if (scope === "hallucinations") {
    let query = supabase
      .from("hallucinations")
      .select("id,client_id,platform_id,query,incorrect_info,correct_info,risk_level,status,detected_at,created_at")
      .order("detected_at", { ascending: false })
      .limit(1500);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;
    if (error) return { error: error.message };
    return { rows: data ?? [] };
  }

  let query = supabase
    .from("optimizations")
    .select("id,client_id,title,description,impact,effort,status,readiness_score,created_at,updated_at,completed_at")
    .order("updated_at", { ascending: false })
    .limit(1500);

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { rows: data ?? [] };
}

export async function requestDataExportAction(input: RequestExportInput): Promise<RequestExportResult> {
  const parsed = requestExportSchema.safeParse({
    format: input.format,
    scope: input.scope,
    clientId: input.clientId ?? null
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid export request." };
  }

  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { ok: false, error: "Session not found." };
  }

  const user = await getCurrentUser(accessToken);
  if (!user) {
    return { ok: false, error: "User not authenticated." };
  }

  const loaded = await loadScopeRows(parsed.data.scope, parsed.data.clientId ?? null, accessToken, user.agencyId);
  if ("error" in loaded) {
    return { ok: false, error: loaded.error };
  }

  const rows = normalizeRows(loaded.rows);
  const generatedAt = new Date();
  const timeStamp = generatedAt.toISOString().replace(/[:.]/g, "-");
  const scopeLabel = mapScopeToTitle(parsed.data.scope);

  if (parsed.data.format === "csv") {
    const fileName = `brand-radar-${parsed.data.scope}-${timeStamp}.csv`;
    return {
      ok: true,
      fileName,
      mimeType: "text/csv;charset=utf-8",
      contentBase64: asBase64(serializeCsv(rows)),
      rowCount: rows.length
    };
  }

  if (parsed.data.format === "json") {
    const fileName = `brand-radar-${parsed.data.scope}-${timeStamp}.json`;
    return {
      ok: true,
      fileName,
      mimeType: "application/json;charset=utf-8",
      contentBase64: asBase64(
        JSON.stringify(
          {
            exportedAt: generatedAt.toISOString(),
            scope: parsed.data.scope,
            rowCount: rows.length,
            rows
          },
          null,
          2
        )
      ),
      rowCount: rows.length
    };
  }

  const previewLines = rows.slice(0, 32).map((row, index) => {
    const firstEntries = Object.entries(row)
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}`)
      .join(" | ");
    return `${index + 1}. ${firstEntries}`;
  });

  const pdfBuffer = buildSimplePdf([
    "Brand Radar Export",
    `Scope: ${scopeLabel}`,
    `Rows: ${rows.length}`,
    `Generated: ${generatedAt.toISOString()}`,
    "",
    ...previewLines,
    rows.length > 32 ? `... ${rows.length - 32} more rows omitted in PDF preview.` : ""
  ]);

  return {
    ok: true,
    fileName: `brand-radar-${parsed.data.scope}-${timeStamp}.pdf`,
    mimeType: "application/pdf",
    contentBase64: asBase64(pdfBuffer),
    rowCount: rows.length
  };
}
