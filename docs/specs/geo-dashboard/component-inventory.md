# Task 1.1 - HTML to Next.js Component Inventory

Bu dokuman `brand-radar.html` dosyasini Next.js App Router yapisina tasimak icin referans envanteri olarak hazirlandi.

## Referanslar

- `requirements.md`: Gereksinim 2.1 (dashboard metrikleri), 17.1 (responsive breakpoint)
- `design.md`: App Router sayfa yapisi, layout/component ayristirma prensibi

## Tasarim Tokenlari

### Renkler

- `primary`: `#376df6`
- `primary-dark`: `#2563eb`
- `background-light`: `#f5f6f8`
- `background-dark`: `#000000`
- `surface-dark`: `#18181b`
- `surface-border`: `#27272a`
- `sidebar-bg`: `#09090b`
- `text-secondary`: `#a1a1aa`
- `critical`: `#ef4444`
- `warning`: `#f59e0b`
- `success`: `#22c55e`

### Tipografi

- Display: `Inter`
- Mono: `JetBrains Mono`

### Yardimci Stil Davranislari

- `glass-header` (blur + yarim saydam header)
- `animate-pulse-line` (trend cizgi animasyonu)
- `animate-float-slow` (yavas yukari-asagi animasyon)
- `custom-checkbox`

## Mevcut React Prototip Bilesenleri (brand-radar.html)

- `Layout`
- `DashboardHeader`
- `DashboardPage`
- `ClientListPage`
- `BrandMentionsPage`
- `CompetitorsPage`
- `OptimizationsPage`
- `CitationForensicsPage`
- `AddClientPage`
- `ActivationPage`
- `HallucinationsPage`
- `SettingsPage`

## Next.js Hedef Bilesen Ayrisimi

### Layout katmani

- `src/app/(dashboard)/layout.tsx`: genel sayfa iskeleti
- `src/components/layout/sidebar.tsx`: sol menu
- `src/components/layout/header.tsx`: ust bar + breadcrumb + filtre kontrolleri

### Dashboard katmani

- `src/components/dashboard/metric-card.tsx`: AI SoV, Citation, Sentiment, Traffic kartlari
- `src/components/dashboard/visibility-trend.tsx`: line chart bolgesi
- `src/components/dashboard/live-mentions-feed.tsx`: real-time mention listesi

### Feature katmani

- `mentions`: telemetry feed + sentiment ozetleri
- `competitors`: radar + gap listesi
- `optimizations`: readiness + kanban kolonlari
- `citations`: authority map + source listeleri
- `settings`: profile/branding/integration bloklari

## Route Esleme (Prototip -> App Router)

- `/` -> `src/app/(dashboard)/page.tsx`
- `/clients` -> `src/app/(dashboard)/clients/page.tsx`
- `/visibility` -> `src/app/(dashboard)/visibility/page.tsx`
- `/mentions` -> `src/app/(dashboard)/mentions/page.tsx`
- `/competitors` -> `src/app/(dashboard)/competitors/page.tsx`
- `/optimizations` -> `src/app/(dashboard)/optimizations/page.tsx`
- `/forensics` -> `src/app/(dashboard)/citations/page.tsx`
- `/hallucinations` -> `src/app/(dashboard)/hallucinations/page.tsx`
- `/settings` -> `src/app/(dashboard)/settings/page.tsx`
- `/add-client` -> `src/app/(dashboard)/clients/new/page.tsx`
- `/activation` -> onboarding akisi (gecici olarak auth grubunda tutulacak)

## Responsive Notlari (Gereksinim 17.1)

- Desktop: `1920px+`
- Tablet: `768px - 1919px`
- Mobile: `320px - 767px`
- Sidebar mobile'da off-canvas/hamburger davranisina alinacak.

