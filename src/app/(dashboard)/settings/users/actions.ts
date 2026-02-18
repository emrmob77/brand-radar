"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { sendEmailWithResend } from "@/lib/email/resend";
import { buildInvitationEmailTemplate, type EmailBranding } from "@/lib/email/templates";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  role: z.enum(["admin", "editor", "viewer"], { message: "Select a valid role." }),
  clientIds: z.array(z.string().uuid()).min(1, "Select at least one client permission.")
});

export type InviteUserFormState = {
  error: string | null;
  success: string | null;
};

export const initialInviteUserFormState: InviteUserFormState = {
  error: null,
  success: null
};

function normalizeHexColor(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function getInvitationActionLink(data: unknown): string | null {
  const maybeData = data as {
    properties?: { action_link?: string };
    action_link?: string;
  } | null;

  if (typeof maybeData?.properties?.action_link === "string" && maybeData.properties.action_link) {
    return maybeData.properties.action_link;
  }

  if (typeof maybeData?.action_link === "string" && maybeData.action_link) {
    return maybeData.action_link;
  }

  return null;
}

function defaultNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "Invited User";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function ensureInviteAlertRule(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  clientId: string
) {
  const existing = await supabase
    .from("alert_rules")
    .select("id")
    .eq("client_id", clientId)
    .eq("name", "User Invitation Queue")
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) return existing.data.id;

  const created = await supabase
    .from("alert_rules")
    .insert({
      client_id: clientId,
      name: "User Invitation Queue",
      metric: "competitor_movement",
      condition: "above",
      threshold: 0,
      enabled: false
    })
    .select("id")
    .maybeSingle();

  return created.data?.id ?? null;
}

async function getAgencyEmailBranding(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  agencyId: string
): Promise<EmailBranding> {
  const fallback: EmailBranding = {
    companyName: "Brand Radar",
    logoUrl: null,
    primaryColor: "#171a20",
    secondaryColor: "#2563eb"
  };

  const agencyResult = await supabase
    .from("agencies")
    .select("name,logo_url,primary_color,secondary_color")
    .eq("id", agencyId)
    .maybeSingle();

  if (agencyResult.error || !agencyResult.data) {
    return fallback;
  }

  return {
    companyName: agencyResult.data.name ?? fallback.companyName,
    logoUrl: agencyResult.data.logo_url ?? null,
    primaryColor: normalizeHexColor(agencyResult.data.primary_color, fallback.primaryColor),
    secondaryColor: normalizeHexColor(agencyResult.data.secondary_color, fallback.secondaryColor)
  };
}

export async function inviteUserAction(
  _prev: InviteUserFormState,
  formData: FormData
): Promise<InviteUserFormState> {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { error: "Session not found.", success: null };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    clientIds: formData.getAll("clientIds")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Validation failed.",
      success: null
    };
  }

  const actor = await getCurrentUser(accessToken);
  if (!actor || actor.role !== "admin") {
    return {
      error: "Only admin users can send invitations.",
      success: null
    };
  }

  const supabase = createServerSupabaseClient(accessToken);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();
  const redirectTo = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/login` : undefined;
  const agencyBranding = await getAgencyEmailBranding(supabase, actor.agencyId);

  if (serviceRoleKey && supabaseUrl) {
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    let invitedUserId: string | undefined;
    let brandedDeliveryEnabled = false;

    if (resendApiKey && emailFrom) {
      const linkResult = await serviceClient.auth.admin.generateLink({
        type: "invite",
        email: parsed.data.email,
        options: {
          data: {
            agency_id: actor.agencyId,
            role: parsed.data.role,
            client_ids: parsed.data.clientIds
          },
          redirectTo
        }
      });

      if (linkResult.error) {
        return { error: linkResult.error.message, success: null };
      }

      invitedUserId = linkResult.data.user?.id;
      const actionLink = getInvitationActionLink(linkResult.data);

      if (!actionLink) {
        return { error: "Failed to generate invitation link.", success: null };
      }

      const template = buildInvitationEmailTemplate({
        branding: agencyBranding,
        recipientEmail: parsed.data.email,
        preheader: `${agencyBranding.companyName} invited you to the dashboard.`,
        title: "You were invited to Brand Radar",
        intro: `${actor.fullName} added you to ${agencyBranding.companyName}'s workspace.`,
        bulletPoints: [
          `Role: ${parsed.data.role}`,
          `Client permissions: ${parsed.data.clientIds.length} selected`,
          "Use the secure link below to activate your account."
        ],
        ctaLabel: "Accept Invitation",
        ctaUrl: actionLink
      });

      const sendResult = await sendEmailWithResend({
        apiKey: resendApiKey,
        from: emailFrom,
        to: parsed.data.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      if (!sendResult.ok) {
        return { error: sendResult.error, success: null };
      }

      brandedDeliveryEnabled = true;
    } else {
      const inviteResult = await serviceClient.auth.admin.inviteUserByEmail(parsed.data.email, {
        data: {
          agency_id: actor.agencyId,
          role: parsed.data.role,
          client_ids: parsed.data.clientIds
        },
        redirectTo
      });

      if (inviteResult.error) {
        return { error: inviteResult.error.message, success: null };
      }

      invitedUserId = inviteResult.data.user?.id;
    }

    if (invitedUserId) {
      const upsertResult = await serviceClient.from("users").upsert(
        {
          id: invitedUserId,
          agency_id: actor.agencyId,
          email: parsed.data.email,
          full_name: defaultNameFromEmail(parsed.data.email),
          role: parsed.data.role
        },
        { onConflict: "id" }
      );
      if (upsertResult.error) {
        return { error: upsertResult.error.message, success: null };
      }
    }

    revalidatePath("/settings/users");
    return {
      error: null,
      success: brandedDeliveryEnabled
        ? `Branded invitation sent to ${parsed.data.email}.`
        : `Invitation sent to ${parsed.data.email}. Configure RESEND_API_KEY and EMAIL_FROM for branded email templates.`
    };
  }

  const firstClientId = parsed.data.clientIds[0];
  if (!firstClientId) {
    return {
      error: "Select at least one client permission.",
      success: null
    };
  }

  const ruleId = await ensureInviteAlertRule(supabase, firstClientId);
  if (ruleId) {
    await supabase.from("alerts").insert({
      alert_rule_id: ruleId,
      client_id: firstClientId,
      title: "User invitation queued",
      message: `Invite requested for ${parsed.data.email} as ${parsed.data.role}. Client permissions: ${parsed.data.clientIds.join(", ")}`,
      severity: "info"
    });
  }

  revalidatePath("/settings/users");
  return {
    error: null,
    success: `Invite queued for ${parsed.data.email}. Configure SUPABASE_SERVICE_ROLE_KEY to enable email delivery.`
  };
}
