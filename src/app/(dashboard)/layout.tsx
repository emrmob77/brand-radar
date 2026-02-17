import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/geo-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getDashboardClients() {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return [];
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.from("clients").select("id,name,domain").order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const clients = await getDashboardClients();
  return (
    <AppShell accessToken={accessToken} clients={clients}>
      {children}
    </AppShell>
  );
}
