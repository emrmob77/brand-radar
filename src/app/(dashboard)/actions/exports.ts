"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logServerError } from "@/lib/monitoring/error-logger";
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

const requestBulkExportSchema = z.object({
  format: exportFormatSchema,
  scope: exportScopeSchema,
  clientIds: z.array(z.string().uuid()).min(2, "Select at least two clients for bulk export.").max(25)
});

type ExportFormat = z.infer<typeof exportFormatSchema>;
type ExportScope = z.infer<typeof exportScopeSchema>;

type ExportRow = Record<string, unknown>;

export type RequestExportInput = {
  format: ExportFormat;
  scope: ExportScope;
  clientId?: string | null;
};

export type RequestBulkExportInput = {
  format: ExportFormat;
  scope: ExportScope;
  clientIds: string[];
};

export type ExportClientOption = {
  id: string;
  name: string;
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

type DistributionItem = {
  label: string;
  value: number;
};

type PdfColumn = {
  key: string;
  label: string;
  maxChars: number;
};

function toRgbComponents(hex: string): [number, number, number] {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : "171a20";
  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return [red, green, blue];
}

function rgbCommand([red, green, blue]: [number, number, number], mode: "fill" | "stroke") {
  const suffix = mode === "fill" ? "rg" : "RG";
  return `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)} ${suffix}`;
}

function drawText(x: number, y: number, size: number, text: string): string {
  return `BT /F1 ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`;
}

function drawRect(x: number, y: number, width: number, height: number, mode: "fill" | "stroke"): string {
  const command = mode === "fill" ? "f" : "S";
  return `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${command}`;
}

function drawLine(x1: number, y1: number, x2: number, y2: number): string {
  return `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function valueToText(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => valueToText(item)).join(", ");
  }
  return JSON.stringify(value);
}

function getTableColumns(scope: ExportScope): PdfColumn[] {
  if (scope === "mentions" || scope === "overview" || scope === "visibility" || scope === "trends") {
    return [
      { key: "query", label: "Query", maxChars: 28 },
      { key: "sentiment", label: "Sentiment", maxChars: 10 },
      { key: "sentiment_score", label: "Score", maxChars: 8 },
      { key: "detected_at", label: "Detected", maxChars: 19 }
    ];
  }

  if (scope === "citations") {
    return [
      { key: "query", label: "Query", maxChars: 22 },
      { key: "source_type", label: "Source", maxChars: 10 },
      { key: "authority_score", label: "Authority", maxChars: 8 },
      { key: "detected_at", label: "Detected", maxChars: 19 }
    ];
  }

  if (scope === "alerts") {
    return [
      { key: "title", label: "Title", maxChars: 28 },
      { key: "severity", label: "Severity", maxChars: 10 },
      { key: "read", label: "Read", maxChars: 8 },
      { key: "created_at", label: "Created", maxChars: 19 }
    ];
  }

  if (scope === "competitors") {
    return [
      { key: "name", label: "Name", maxChars: 20 },
      { key: "domain", label: "Domain", maxChars: 24 },
      { key: "client_id", label: "Client", maxChars: 12 },
      { key: "created_at", label: "Created", maxChars: 19 }
    ];
  }

  if (scope === "hallucinations") {
    return [
      { key: "query", label: "Query", maxChars: 24 },
      { key: "risk_level", label: "Risk", maxChars: 8 },
      { key: "status", label: "Status", maxChars: 12 },
      { key: "detected_at", label: "Detected", maxChars: 19 }
    ];
  }

  if (scope === "optimizations") {
    return [
      { key: "title", label: "Title", maxChars: 24 },
      { key: "status", label: "Status", maxChars: 12 },
      { key: "impact", label: "Impact", maxChars: 10 },
      { key: "updated_at", label: "Updated", maxChars: 19 }
    ];
  }

  return [
    { key: "name", label: "Name", maxChars: 22 },
    { key: "domain", label: "Domain", maxChars: 20 },
    { key: "industry", label: "Industry", maxChars: 14 },
    { key: "health_score", label: "Health", maxChars: 8 }
  ];
}

function resolveDistributionField(scope: ExportScope): string | null {
  if (scope === "mentions" || scope === "overview" || scope === "visibility" || scope === "trends") return "sentiment";
  if (scope === "citations") return "source_type";
  if (scope === "alerts") return "severity";
  if (scope === "hallucinations") return "risk_level";
  if (scope === "optimizations") return "status";
  if (scope === "clients") return "industry";
  return null;
}

function buildDistribution(scope: ExportScope, rows: ExportRow[]): DistributionItem[] {
  const field = resolveDistributionField(scope);
  const counts = new Map<string, number>();

  if (field) {
    for (const row of rows) {
      const raw = row[field];
      if (typeof raw !== "string" || raw.trim().length === 0) {
        continue;
      }
      const key = raw.trim();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    for (const row of rows) {
      const rawDate = typeof row.detected_at === "string"
        ? row.detected_at
        : typeof row.created_at === "string"
          ? row.created_at
          : null;

      if (!rawDate) {
        continue;
      }

      const day = rawDate.slice(0, 10);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  }

  const sorted = Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);

  return sorted.slice(0, 6);
}

function extractDateRange(rows: ExportRow[]): { from: string; to: string } {
  let minTime = Number.POSITIVE_INFINITY;
  let maxTime = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    const candidates = [row.detected_at, row.created_at, row.updated_at];
    for (const candidate of candidates) {
      if (typeof candidate !== "string") {
        continue;
      }
      const time = Date.parse(candidate);
      if (Number.isNaN(time)) {
        continue;
      }
      minTime = Math.min(minTime, time);
      maxTime = Math.max(maxTime, time);
    }
  }

  if (!Number.isFinite(minTime) || !Number.isFinite(maxTime)) {
    return { from: "-", to: "-" };
  }

  return {
    from: new Date(minTime).toISOString().slice(0, 10),
    to: new Date(maxTime).toISOString().slice(0, 10)
  };
}

function buildSummaryCards(scope: ExportScope, rows: ExportRow[]): Array<{ label: string; value: string }> {
  const uniqueClients = new Set(
    rows
      .map((row) => row.client_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  ).size;

  const dateRange = extractDateRange(rows);
  const distribution = buildDistribution(scope, rows);
  const topSegment = distribution[0];

  return [
    { label: "Rows", value: String(rows.length) },
    { label: "Clients", value: uniqueClients > 0 ? String(uniqueClients) : "N/A" },
    { label: "Date Range", value: dateRange.from === "-" ? "-" : `${dateRange.from} to ${dateRange.to}` },
    { label: "Top Segment", value: topSegment ? `${topSegment.label} (${topSegment.value})` : "-" }
  ];
}

function buildSinglePagePdf(contentStream: string): Buffer {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream\nendobj\n`
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

function buildReportPdf(scope: ExportScope, scopeLabel: string, rows: ExportRow[], generatedAt: Date): Buffer {
  const primary = toRgbComponents("#171a20");
  const accent = toRgbComponents("#376df6");
  const border = toRgbComponents("#d9dadd");
  const muted = toRgbComponents("#5f6368");
  const softFill = toRgbComponents("#f6f7fb");

  const commands: string[] = [];
  const pageWidth = 612;
  const pageHeight = 792;

  commands.push(rgbCommand([1, 1, 1], "fill"));
  commands.push(drawRect(0, 0, pageWidth, pageHeight, "fill"));

  commands.push(rgbCommand(primary, "fill"));
  commands.push(drawText(40, 760, 21, "Brand Radar"));
  commands.push(rgbCommand(muted, "fill"));
  commands.push(drawText(40, 742, 11, `${scopeLabel} Report`));
  commands.push(drawText(40, 727, 10, `Generated at: ${generatedAt.toISOString()}`));

  const summaryCards = buildSummaryCards(scope, rows);
  const cardWidth = 126;
  const cardGap = 10;
  const cardY = 656;

  summaryCards.forEach((card, index) => {
    const x = 40 + index * (cardWidth + cardGap);
    commands.push(rgbCommand(softFill, "fill"));
    commands.push(drawRect(x, cardY, cardWidth, 64, "fill"));
    commands.push(rgbCommand(border, "stroke"));
    commands.push("0.8 w");
    commands.push(drawRect(x, cardY, cardWidth, 64, "stroke"));
    commands.push(rgbCommand(muted, "fill"));
    commands.push(drawText(x + 8, cardY + 46, 9, card.label.toUpperCase()));
    commands.push(rgbCommand(primary, "fill"));
    commands.push(drawText(x + 8, cardY + 24, 12, truncateText(card.value, 24)));
  });

  const distribution = buildDistribution(scope, rows);
  const chartX = 40;
  const chartY = 410;
  const chartW = 532;
  const chartH = 222;
  commands.push(rgbCommand(softFill, "fill"));
  commands.push(drawRect(chartX, chartY, chartW, chartH, "fill"));
  commands.push(rgbCommand(border, "stroke"));
  commands.push("0.8 w");
  commands.push(drawRect(chartX, chartY, chartW, chartH, "stroke"));
  commands.push(rgbCommand(primary, "fill"));
  commands.push(drawText(chartX + 12, chartY + chartH - 20, 12, "Distribution"));
  commands.push(rgbCommand(muted, "fill"));
  commands.push(drawText(chartX + 12, chartY + chartH - 36, 9, "Top segments by row count"));

  const maxValue = Math.max(1, ...distribution.map((item) => item.value));
  distribution.forEach((item, index) => {
    const rowY = chartY + chartH - 62 - index * 26;
    const label = truncateText(item.label, 20);
    const ratio = item.value / maxValue;
    const barStart = chartX + 182;
    const barMax = 300;
    const barWidth = Math.max(2, Math.round(barMax * ratio));

    commands.push(rgbCommand(primary, "fill"));
    commands.push(drawText(chartX + 12, rowY + 5, 10, label));
    commands.push(rgbCommand(border, "fill"));
    commands.push(drawRect(barStart, rowY, barMax, 12, "fill"));
    commands.push(rgbCommand(accent, "fill"));
    commands.push(drawRect(barStart, rowY, barWidth, 12, "fill"));
    commands.push(rgbCommand(primary, "fill"));
    commands.push(drawText(barStart + barMax + 8, rowY + 2, 10, String(item.value)));
  });

  if (distribution.length === 0) {
    commands.push(rgbCommand(muted, "fill"));
    commands.push(drawText(chartX + 12, chartY + 108, 10, "No distribution data available for this scope."));
  }

  const tableColumns = getTableColumns(scope);
  const tableRows = rows.slice(0, 8);
  const tableX = 40;
  const tableY = 78;
  const tableW = 532;
  const tableH = 306;

  commands.push(rgbCommand([1, 1, 1], "fill"));
  commands.push(drawRect(tableX, tableY, tableW, tableH, "fill"));
  commands.push(rgbCommand(border, "stroke"));
  commands.push("0.8 w");
  commands.push(drawRect(tableX, tableY, tableW, tableH, "stroke"));
  commands.push(rgbCommand(primary, "fill"));
  commands.push(drawText(tableX + 12, tableY + tableH - 20, 12, "Sample Data Table"));
  commands.push(rgbCommand(muted, "fill"));
  commands.push(drawText(tableX + 12, tableY + tableH - 36, 9, `Showing first ${tableRows.length} rows`));

  const gridTop = tableY + tableH - 56;
  const rowHeight = 24;
  const colCount = tableColumns.length;
  const colWidth = (tableW - 24) / colCount;
  const gridLeft = tableX + 12;
  const gridRight = tableX + tableW - 12;

  commands.push(rgbCommand(softFill, "fill"));
  commands.push(drawRect(gridLeft, gridTop - rowHeight, tableW - 24, rowHeight, "fill"));
  commands.push(rgbCommand(border, "stroke"));
  commands.push(drawLine(gridLeft, gridTop - rowHeight, gridRight, gridTop - rowHeight));

  tableColumns.forEach((column, columnIndex) => {
    const colX = gridLeft + columnIndex * colWidth;
    commands.push(rgbCommand(primary, "fill"));
    commands.push(drawText(colX + 4, gridTop - 16, 9, truncateText(column.label, column.maxChars)));
    if (columnIndex > 0) {
      commands.push(rgbCommand(border, "stroke"));
      commands.push(drawLine(colX, gridTop - rowHeight * (tableRows.length + 1), colX, gridTop));
    }
  });

  tableRows.forEach((row, rowIndex) => {
    const rowBase = gridTop - (rowIndex + 2) * rowHeight;
    commands.push(rgbCommand(border, "stroke"));
    commands.push(drawLine(gridLeft, rowBase, gridRight, rowBase));

    tableColumns.forEach((column, columnIndex) => {
      const text = truncateText(valueToText(row[column.key]), column.maxChars);
      const colX = gridLeft + columnIndex * colWidth;
      commands.push(rgbCommand(primary, "fill"));
      commands.push(drawText(colX + 4, rowBase + 8, 9, text));
    });
  });

  commands.push(rgbCommand(muted, "fill"));
  commands.push(drawText(40, 56, 8, "Export contains filtered workspace data. Use CSV/JSON for full untruncated payload."));

  return buildSinglePagePdf(commands.join("\n"));
}

function asBase64(value: string | Buffer) {
  return Buffer.isBuffer(value) ? value.toString("base64") : Buffer.from(value, "utf8").toString("base64");
}

function toBuffer(value: string | Buffer): Buffer {
  return Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
}

function sanitizeFileToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "client";
}

function dosDateTime(date: Date): { date: number; time: number } {
  const year = Math.max(1980, date.getUTCFullYear());
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = Math.floor(date.getUTCSeconds() / 2);

  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  return { date: dosDate, time: dosTime };
}

function buildCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let step = 0; step < 8; step += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

const CRC32_TABLE = buildCrc32Table();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    const byte = buffer[index] ?? 0;
    const lookupIndex = (crc ^ byte) & 0xff;
    crc = CRC32_TABLE[lookupIndex]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(entries: Array<{ name: string; content: Buffer }>, generatedAt: Date): Buffer {
  const localSegments: Buffer[] = [];
  const centralSegments: Buffer[] = [];
  let offset = 0;
  const dosTime = dosDateTime(generatedAt);

  entries.forEach((entry) => {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const dataBuffer = entry.content;
    const checksum = crc32(dataBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime.time, 10);
    localHeader.writeUInt16LE(dosTime.date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localSegments.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime.time, 12);
    centralHeader.writeUInt16LE(dosTime.date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralSegments.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  });

  const centralDirectory = Buffer.concat(centralSegments);
  const localData = Buffer.concat(localSegments);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(localData.length, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([localData, centralDirectory, endRecord]);
}

function buildExportFile(
  format: ExportFormat,
  scope: ExportScope,
  rows: ExportRow[],
  generatedAt: Date,
  fileBaseName: string
): {
  fileName: string;
  mimeType: string;
  content: Buffer;
  rowCount: number;
} {
  const scopeLabel = mapScopeToTitle(scope);

  if (format === "csv") {
    return {
      fileName: `${fileBaseName}.csv`,
      mimeType: "text/csv;charset=utf-8",
      content: toBuffer(serializeCsv(rows)),
      rowCount: rows.length
    };
  }

  if (format === "json") {
    return {
      fileName: `${fileBaseName}.json`,
      mimeType: "application/json;charset=utf-8",
      content: toBuffer(
        JSON.stringify(
          {
            exportedAt: generatedAt.toISOString(),
            scope,
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

  return {
    fileName: `${fileBaseName}.pdf`,
    mimeType: "application/pdf",
    content: buildReportPdf(scope, scopeLabel, rows, generatedAt),
    rowCount: rows.length
  };
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

async function logExportAuditEntry(params: {
  accessToken: string;
  agencyId: string;
  userId: string;
  clientId: string | null;
  scope: ExportScope;
  format: "csv" | "json" | "pdf" | "zip";
  fileName: string;
  rowCount: number;
  isBulk: boolean;
}) {
  const supabase = createServerSupabaseClient(params.accessToken);
  await supabase.from("export_audit_logs").insert({
    agency_id: params.agencyId,
    user_id: params.userId,
    client_id: params.clientId,
    scope: params.scope,
    format: params.format,
    file_name: params.fileName,
    row_count: params.rowCount,
    is_bulk: params.isBulk
  });
}

export async function requestDataExportAction(input: RequestExportInput): Promise<RequestExportResult> {
  try {
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
    const file = buildExportFile(
      parsed.data.format,
      parsed.data.scope,
      rows,
      generatedAt,
      `brand-radar-${parsed.data.scope}-${timeStamp}`
    );

    await logExportAuditEntry({
      accessToken,
      agencyId: user.agencyId,
      userId: user.id,
      clientId: parsed.data.clientId ?? null,
      scope: parsed.data.scope,
      format: parsed.data.format,
      fileName: file.fileName,
      rowCount: file.rowCount,
      isBulk: false
    });

    return {
      ok: true,
      fileName: file.fileName,
      mimeType: file.mimeType,
      contentBase64: asBase64(file.content),
      rowCount: file.rowCount
    };
  } catch (error) {
    await logServerError(error, {
      area: "actions/request-data-export",
      metadata: {
        scope: input.scope,
        format: input.format,
        clientId: input.clientId ?? null
      }
    });
    return { ok: false, error: "Export request failed unexpectedly." };
  }
}

export async function listExportClientsAction(): Promise<{ ok: true; clients: ExportClientOption[] } | { ok: false; error: string }> {
  try {
    const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) {
      return { ok: false, error: "Session not found." };
    }

    const user = await getCurrentUser(accessToken);
    if (!user) {
      return { ok: false, error: "User not authenticated." };
    }

    const supabase = createServerSupabaseClient(accessToken);
    const query = await supabase
      .from("clients")
      .select("id,name")
      .eq("agency_id", user.agencyId)
      .order("name", { ascending: true })
      .limit(300);

    if (query.error) {
      return { ok: false, error: query.error.message };
    }

    return {
      ok: true,
      clients: (query.data ?? []).map((client) => ({ id: client.id, name: client.name }))
    };
  } catch (error) {
    await logServerError(error, {
      area: "actions/list-export-clients"
    });
    return { ok: false, error: "Could not load clients for export." };
  }
}

export async function requestBulkDataExportAction(input: RequestBulkExportInput): Promise<RequestExportResult> {
  try {
    const parsed = requestBulkExportSchema.safeParse({
      format: input.format,
      scope: input.scope,
      clientIds: input.clientIds
    });

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid bulk export request." };
    }

    const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) {
      return { ok: false, error: "Session not found." };
    }

    const user = await getCurrentUser(accessToken);
    if (!user) {
      return { ok: false, error: "User not authenticated." };
    }

    const supabase = createServerSupabaseClient(accessToken);
    const clientsQuery = await supabase
      .from("clients")
      .select("id,name")
      .eq("agency_id", user.agencyId)
      .in("id", parsed.data.clientIds);

    if (clientsQuery.error) {
      return { ok: false, error: clientsQuery.error.message };
    }

    const clients = clientsQuery.data ?? [];
    if (clients.length === 0) {
      return { ok: false, error: "No valid clients found for bulk export." };
    }

    const generatedAt = new Date();
    const entries: Array<{ name: string; content: Buffer }> = [];
    let totalRows = 0;

    for (const client of clients) {
      const loaded = await loadScopeRows(parsed.data.scope, client.id, accessToken, user.agencyId);
      if ("error" in loaded) {
        return { ok: false, error: loaded.error };
      }

      const rows = normalizeRows(loaded.rows);
      totalRows += rows.length;

      const file = buildExportFile(
        parsed.data.format,
        parsed.data.scope,
        rows,
        generatedAt,
        `${sanitizeFileToken(client.name)}-${parsed.data.scope}`
      );

      entries.push({
        name: file.fileName,
        content: file.content
      });
    }

    const zipBuffer = buildZip(entries, generatedAt);
    const timeStamp = generatedAt.toISOString().replace(/[:.]/g, "-");
    const zipFileName = `brand-radar-${parsed.data.scope}-bulk-${timeStamp}.zip`;

    await logExportAuditEntry({
      accessToken,
      agencyId: user.agencyId,
      userId: user.id,
      clientId: null,
      scope: parsed.data.scope,
      format: "zip",
      fileName: zipFileName,
      rowCount: totalRows,
      isBulk: true
    });

    return {
      ok: true,
      fileName: zipFileName,
      mimeType: "application/zip",
      contentBase64: asBase64(zipBuffer),
      rowCount: totalRows
    };
  } catch (error) {
    await logServerError(error, {
      area: "actions/request-bulk-data-export",
      metadata: {
        scope: input.scope,
        format: input.format,
        clientCount: input.clientIds.length
      }
    });
    return { ok: false, error: "Bulk export request failed unexpectedly." };
  }
}
