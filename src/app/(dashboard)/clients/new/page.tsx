import { cookies } from "next/headers";
import Link from "next/link";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { NewClientForm } from "@/app/(dashboard)/clients/new/new-client-form";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getPlatformOptions() {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return [];
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.from("platforms").select("id,name,slug").eq("active", true).order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export default async function NewClientPage() {
  const platforms = await getPlatformOptions();

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        actions={
          <Link className="focus-ring inline-flex items-center rounded-xl border border-surface-border bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-brand-soft" href="/clients">
            Back to Client List
          </Link>
        }
        description="Create a new managed brand profile, attach active AI channels, and start visibility tracking."
        title="New Client"
      />

      <NewClientForm platforms={platforms} />
    </div>
  );
}
