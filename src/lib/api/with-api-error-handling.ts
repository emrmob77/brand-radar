import { NextResponse } from "next/server";
import { logServerError } from "@/lib/monitoring/error-logger";

type ApiHandler = () => Promise<NextResponse>;

export async function withApiErrorHandling(handler: ApiHandler, area: string) {
  try {
    return await handler();
  } catch (error) {
    await logServerError(error, { area });
    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected server error."
      },
      { status: 500 }
    );
  }
}
