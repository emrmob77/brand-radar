type SendEmailParams = {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmailWithResend(params: SendEmailParams): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const details = await response.text();
      return {
        ok: false,
        error: `Resend API error (${response.status}): ${details}`
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown email delivery error."
    };
  }
}
