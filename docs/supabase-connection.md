# Supabase Connection (Brand Radar)

## Active Project

- `project_ref`: `ruqdlztjsojrhvoeagbg`
- `project_url`: `https://ruqdlztjsojrhvoeagbg.supabase.co`
- `region`: `eu-west-1`
- `status`: `ACTIVE_HEALTHY`

## Local Setup

1. Use `.env.example` as reference.
2. Put real values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Client helper is at `src/lib/supabase/client.ts`.
4. Service role helper is at `src/lib/supabase/service-role.ts`.

## Notes

- `supabase/config.toml` is pinned to the active project ref.
- DB schema and migrations should be created under `supabase/migrations`.
- Applied via MCP (current project history):
  - `geo_dashboard_core_schema`
  - `geo_dashboard_rls_policies`
  - `geo_dashboard_seed_platforms`
  - `geo_dashboard_client_logo_storage`
  - `geo_dashboard_sync_missing_tables_and_onboarding`
  - `geo_dashboard_auth_profile_provisioning`
  - `geo_dashboard_export_audit_logs`
  - `geo_dashboard_onboarding_state`
  - `geo_dashboard_api_and_webhooks`
- Auth profile sync:
  - `auth.users` -> `public.users` provisioning is handled by trigger/function from `geo_dashboard_auth_profile_provisioning`.
- RLS role verification script:
  - `supabase/tests/rls_role_verification.sql`
  - Validated with transactional run on 2026-02-17 (no persistent fixture data)
