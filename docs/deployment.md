# Deployment Guide (Production)

## 1. Production Project Setup

1. Yeni bir Supabase production projesi olustur.
2. Tum migration dosyalarini production veritabanina uygula.
3. `client-logos` bucket'ini olustur ve public read ayarini kontrol et.
4. Auth ve SMTP ayarlarini production domain'e gore guncelle.

## 2. Environment Variables

Production ortaminda asagidaki degiskenleri tanimla:

- `NEXT_PUBLIC_APP_URL` (orn: `https://geo.example.com`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CDN_URL` (opsiyonel CDN domain)
- `RESEND_API_KEY`, `EMAIL_FROM`
- `ERROR_LOG_WEBHOOK_URL`, `TELEMETRY_WEBHOOK_URL`
- `WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (opsiyonel, varsayilan `gpt-4.1-mini`)
- `OPENAI_WEB_MODEL` (opsiyonel, varsayilan `gpt-4.1`; web_search_preview destekleyen model onerilir)

Referans: `.env.example`

## 3. Domain ve White-Label

1. Uygulama domain'ini (`geo.example.com`) deployment platformunda bagla.
2. DNS tarafinda CNAME kaydini deployment provider hedefi ile eslestir.
3. Uygulama icinden White-Label sayfasinda custom domain'i kaydet.
4. SSL sertifikasi aktif oldugunu dogrula.

## 4. Build ve Runtime

1. CI asamasinda:
   - `npm ci`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`
2. Next.js `output: "standalone"` ile container/VM deploy et.
3. Statik varliklar icin CDN kullaniliyorsa `NEXT_PUBLIC_CDN_URL` ayarla.

## 5. Monitoring ve Logging

1. `/api/health` endpoint'i ile uptime monitor tanimla.
2. `ERROR_LOG_WEBHOOK_URL` ile server/client error olaylarini toplama servisine aktar.
3. `/api/telemetry` endpoint'i ile web vitals metriklerini topla.
4. Supabase ve uygulama platform loglarini merkezde birlestir.

## 6. Post-Deploy Checklist

1. Login/register akisi calisiyor mu kontrol et.
2. `/activation` onboarding tamamla/atla senaryolarini test et.
3. API key olusturma ve `/api/v1/*` endpointlerini smoke test et.
4. Webhook imzali ornek payload ile `/api/v1/webhooks/ai-monitoring` endpointini test et.
