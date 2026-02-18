type ErrorContext = {
  area: string;
  userId?: string | null;
  agencyId?: string | null;
  metadata?: Record<string, unknown>;
};

type ErrorPayload = {
  timestamp: string;
  message: string;
  stack: string | null;
  context: ErrorContext;
};

function normalizeError(input: unknown) {
  if (input instanceof Error) {
    return {
      message: input.message,
      stack: input.stack ?? null
    };
  }

  if (typeof input === "string") {
    return {
      message: input,
      stack: null
    };
  }

  return {
    message: "Unknown error",
    stack: null
  };
}

function buildPayload(input: unknown, context: ErrorContext): ErrorPayload {
  const normalized = normalizeError(input);
  return {
    timestamp: new Date().toISOString(),
    message: normalized.message,
    stack: normalized.stack,
    context
  };
}

export async function logServerError(input: unknown, context: ErrorContext) {
  const payload = buildPayload(input, context);
  console.error("[server-error]", payload);

  const webhookUrl = process.env.ERROR_LOG_WEBHOOK_URL?.trim();
  if (!webhookUrl || process.env.NODE_ENV !== "production") {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  } catch {
    // Prevent recursive logging loops.
  }
}

export async function logClientError(input: unknown, context: ErrorContext) {
  const payload = buildPayload(input, context);
  if (process.env.NODE_ENV !== "production") {
    console.error("[client-error]", payload);
    return;
  }

  try {
    await fetch("/api/errors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch {
    // Never throw from client logger.
  }
}
