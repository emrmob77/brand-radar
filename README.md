# Brand Radar

Next.js 14 + TypeScript + Tailwind CSS tabanli GEO dashboard projesi.

## Scripts

- `npm run dev`: local gelistirme
- `npm run build`: production build
- `npm run start`: build sonrasi calistirma
- `npm run lint`: eslint
- `npm run typecheck`: TypeScript strict kontrolu

## Env

`.env.local` icin referans: `.env.example`

Gerekli degiskenler:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEBHOOK_SECRET`

Opsiyonel white-label degiskenleri:

- `NEXT_PUBLIC_BRAND_NAME`
- `NEXT_PUBLIC_BRAND_LOGO_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CDN_URL`

Opsiyonel branded email degiskenleri:

- `RESEND_API_KEY`
- `EMAIL_FROM`

Opsiyonel izleme degiskenleri:

- `ERROR_LOG_WEBHOOK_URL`
- `TELEMETRY_WEBHOOK_URL`

## API

- OpenAPI dokumani: `/api/openapi.json`
- Health check: `/api/health`
- External REST API: `/api/v1/*` (API key gerekir)

## Deployment

Production adimlari: `docs/deployment.md`
