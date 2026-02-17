import { Plus } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { ClientList } from "@/app/(dashboard)/clients/client-list";
import { DashboardHeader } from "@/components/layout/geo-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getClients() {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return [];
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("clients")
    .select("id,name,domain,logo_url,industry,health_score")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
}

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <DashboardHeader
        actions={
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600"
            href="/clients/new"
          >
            <Plus className="h-4 w-4" />
            New Client
          </Link>
        }
        description="Track performance, risk posture, and strategic momentum across all managed brands."
        title="Client Portfolio"
      />

      <ClientList clients={clients} />
    </div>
  );
}
