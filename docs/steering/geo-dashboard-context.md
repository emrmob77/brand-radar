---
inclusion: always
---

# GEO Dashboard Proje Context'i

Bu dosya, GEO Dashboard projesinde çalışırken AI'ın her zaman bilmesi gereken bilgileri içerir.

## Önemli Dosyalar

### Tasarım Referansı
- **brand-radar.html** - Workspace root'ta bulunan mevcut HTML tasarım dosyası
  - Bu dosya UI/UX tasarım referansı olarak kullanılmalıdır
  - Tüm component'ler ve layout'lar bu tasarıma uygun olmalıdır
  - Renk paleti, tipografi ve spacing değerleri bu dosyadan alınmalıdır

### Spec Dosyaları
- **docs/specs/geo-dashboard/requirements.md** - Gereksinimler dokümanı
- **docs/specs/geo-dashboard/design.md** - Tasarım dokümanı
- **docs/specs/geo-dashboard/tasks.md** - Görev listesi

## Çalışma Kuralları

1. Her görev çalıştırılmadan önce:
   - İlgili gereksinimleri requirements.md'den kontrol et
   - Tasarım detaylarını design.md'den kontrol et
   - UI tasarımı için brand-radar.html'i referans al

2. Kod yazarken:
   - TypeScript strict mode kullan
   - Tailwind CSS ile stillendir
   - Shadcn/ui component'lerini tercih et
   - Next.js 14 App Router yapısına uy

3. Veritabanı işlemlerinde:
   - Supabase kullan
   - RLS politikalarını uygula
   - Type-safe queries yaz

## Proje Yapısı

```
workspace/
├── brand-radar.html          # Tasarım referansı
├── docs/
│   ├── specs/
│   │   └── geo-dashboard/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── steering/
│       └── geo-dashboard-context.md  # Bu dosya
├── src/
├── supabase/
├── scripts/
└── tests/
└── [proje dosyaları buraya gelecek]
```
