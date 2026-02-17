# Supabase Connection (Brand Radar)

## Active Project

- `project_ref`: `ruqdlztjsojrhvoeagbg`
- `project_url`: `https://ruqdlztjsojrhvoeagbg.supabase.co`
- `region`: `eu-west-1`
- `status`: `COMING_UP` (project is still provisioning)

## Local Setup

1. Use `.env.example` as reference.
2. Put real values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Client helper is at `src/lib/supabase/client.ts`.

## Notes

- `supabase/config.toml` is pinned to the active project ref.
- DB schema and migrations should be created under `supabase/migrations`.

