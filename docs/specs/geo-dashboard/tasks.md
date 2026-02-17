# Uygulama Planı: GEO Dashboard

## Genel Bakış

Bu uygulama planı, GEO Dashboard geliştirmesini ayrık, artımlı görevlere ayırır. Sistem Next.js 14 App Router, TypeScript, Supabase ve modern React ekosistemi kullanılarak inşa edilecektir. Her görev önceki çalışmalar üzerine inşa edilir ve sürekli entegrasyon ile erken doğrulama sağlar.

## Referans Dosyalar

Görevleri çalıştırırken aşağıdaki dosyaları mutlaka inceleyin:

- **brand-radar.html** - Workspace root'ta bulunan mevcut HTML tasarım dosyası. Bu dosya UI/UX tasarım referansı olarak kullanılmalıdır.
- **requirements.md** - Bu spec klasöründe bulunan gereksinimler dokümanı
- **design.md** - Bu spec klasöründe bulunan tasarım dokümanı

Her görev çalıştırılmadan önce ilgili gereksinimleri requirements.md'den ve tasarım detaylarını design.md'den kontrol edin.

## Görevler

- [x] 1. Proje kurulumu ve altyapı
  - [x] 1.1 Mevcut HTML tasarımını Next.js projesine entegre et
    - brand-radar.html dosyasını incele ve bileşenlere ayır
    - HTML'deki tasarım öğelerini ve stilleri belirle
    - Tasarım referansı olarak kullanılacak bileşen listesi oluştur
    - _Gereksinimler: 2.1, 17.1_
  
  - [x] 1.2 Next.js 14 projesini başlat
    - Next.js 14 projesini TypeScript ve App Router ile başlat
    - Tailwind CSS, Shadcn/ui ve temel bağımlılıkları yapılandır
    - Ortam değişkenlerini ve Supabase istemci yapılandırmasını ayarla
    - Tasarım belgesini takip ederek temel klasör yapısını oluştur
    - ESLint, Prettier ve TypeScript strict modunu yapılandır
    - _Gereksinimler: 11.1, 11.2_

- [ ] 2. Supabase veritabanı şeması ve kimlik doğrulama
  - [x] 2.1 Tüm tablolarla veritabanı şeması oluştur
    - agencies, users, clients, platforms, mentions, citations, competitors, queries, optimizations, hallucinations, alert_rules ve alerts tabloları için SQL migration yaz
    - Performans optimizasyonu için indeksler ekle
    - Foreign key ilişkilerini ve cascade delete'leri ayarla
    - _Gereksinimler: 11.4, 1.5, 1.6_
  
  - [x] 2.2 Row Level Security (RLS) politikalarını uygula
    - Çok kiracılı veri izolasyonu için RLS politikaları oluştur
    - Kullanıcıların yalnızca kendi ajanslarının verilerine erişebilmesini sağla
    - Farklı kullanıcı rolleriyle RLS politikalarını test et
    - _Gereksinimler: 11.5, 11.6, 10.6_
  
  - [x] 2.3 Supabase kimlik doğrulamasını ayarla
    - Supabase Auth'u email/password ile yapılandır
    - Korumalı rotalar için kimlik doğrulama middleware'i oluştur
    - Oturum yönetimi ve token yenilemeyi uygula
    - _Gereksinimler: 11.1, 10.1_
  
  - [x] 2.4 İlk platform verilerini ekle
    - ChatGPT, Perplexity, Google AI Overviews, Claude ve Bing Copilot platformlarını ekle
    - Platform ikonlarını ve meta verilerini ekle
    - _Gereksinimler: 3.1_

- [ ] 3. Kimlik doğrulama sayfaları ve düzen
  - [x] 3.1 Giriş sayfası oluştur
    - Email/password alanlarıyla giriş formu oluştur
    - React Hook Form + Zod kullanarak form doğrulaması uygula
    - Supabase kimlik doğrulama mantığını ekle
    - Kimlik doğrulama hatalarını işle ve mesajları göster
    - _Gereksinimler: 11.1_
  
  - [x] 3.2 Kimlik doğrulama düzeni oluştur
    - Kimlik doğrulama sayfaları için merkezli düzen oluştur
    - White-label logo desteği ekle
    - Tailwind CSS ile stillendir
    - _Gereksinimler: 13.3_

- [ ] 4. Dashboard düzeni ve navigasyon
  - [x] 4.1 Kenar çubuğuyla dashboard düzeni oluştur
    - Navigasyon linkleriyle responsive kenar çubuğu oluştur
    - Mobil için daraltılabilir kenar çubuğu uygula
    - Aktif durum vurgulaması ekle
    - _Gereksinimler: 2.1_
  
  - [x] 4.2 Başlık bileşeni oluştur
    - Müşteri seçici dropdown'ı ile başlık oluştur
    - Arama çubuğu placeholder'ı ekle
    - Bildirim zili ikonu uygula
    - Çıkış yapma ile kullanıcı avatar menüsü ekle
    - _Gereksinimler: 1.1, 1.4, 9.5_
  
  - [x] 4.3 Müşteri seçici işlevselliğini uygula
    - Supabase'den müşteri listesini getir
    - Müşteri araması ile dropdown bileşeni oluştur
    - Seçili müşteriyi URL parametrelerinde veya state'te sakla
    - Tüm dashboard verilerini seçili müşteriye göre filtrele
    - _Gereksinimler: 1.4_

- [ ] 5. Müşteri yönetimi
  - [x] 5.1 Müşteri listesi sayfası oluştur
    - Sağlık göstergeleriyle tüm müşterileri getir ve göster
    - Logo, isim, sektör ve sağlık skoru ile müşteri kartları göster
    - "Yeni Müşteri" butonu ekle
    - Müşteri arama ve filtreleme uygula
    - _Gereksinimler: 1.1_
  
  - [x] 5.2 Yeni müşteri formu oluştur
    - İsim, domain, logo yükleme, sektör ve platformlar alanlarıyla form oluştur
    - Form doğrulaması uygula
    - Supabase Storage'a logo yükleme ekle
    - Müşteri oluşturma için Server Action oluştur
    - _Gereksinimler: 1.2, 1.3, 1.5_
  
  - [x] 5.3 Müşteri silme işlemini uygula
    - Onay diyaloguyla silme butonu ekle
    - Cascade delete için Server Action oluştur
    - Optimistic UI güncellemelerini işle
    - _Gereksinimler: 1.6_

- [ ] 6. Dashboard metrikleri ve genel bakış
  - [x] 6.1 MetricCard bileşeni oluştur
    - Başlık, değer ve değişim göstergesiyle yeniden kullanılabilir metrik kartı oluştur
    - Framer Motion kullanarak animasyonlu sayı geçişleri ekle
    - Opsiyonel sparkline grafiği uygula
    - Tailwind CSS ile stillendir
    - _Gereksinimler: 2.1, 2.4_
  
  - [x] 6.2 Dashboard metrik hesaplamasını uygula
    - AI_SoV, Toplam Alıntılar, Duygu Skoru ve Tahmini Trafik Değerini getirmek ve hesaplamak için Server Action oluştur
    - Metrik hesaplama fonksiyonlarını uygula (AI SoV, duygu toplama, sağlık skoru, trafik değeri)
    - Önceki dönemle karşılaştırma ekle
    - _Gereksinimler: 2.1, 2.4_
  
  - [x] 6.3 Görünürlük Trendleri grafiği oluştur
    - Recharts kullanarak çok çizgili grafik oluştur
    - Son 30 günün trend verilerini getir
    - Platform geçiş filtrelerini ekle
    - Responsive tasarım uygula
    - _Gereksinimler: 2.2_
  
  - [x] 6.4 Canlı Bahsetmeler akışı oluştur
    - Gerçek zamanlı akış bileşeni oluştur
    - Yeni bahsetmeler için Supabase gerçek zamanlı aboneliği ayarla
    - Platform ikonu, duygu rozeti ve zaman damgasıyla bahsetme kartları göster
    - Yeni bahsetmeler için otomatik kaydırma animasyonu ekle
    - _Gereksinimler: 2.3, 2.6_

- [ ] 7. AI Platform Görünürlük Takibi
  - [x] 7.1 AI Görünürlük sayfası oluştur
    - Platform görünürlük kartlarıyla sayfa düzeni oluştur
    - Platform başına görünürlük verilerini getir
    - Her platform için görünürlük yüzdesini göster
    - _Gereksinimler: 3.2_
  
  - [x] 7.2 Platform x konu ısı haritası oluştur
    - Özel SVG veya Recharts kullanarak HeatMap bileşeni oluştur
    - Konu kategorilerini ve platform verilerini getir
    - Görünürlüğe göre renk gradyanı uygula
    - Hover tooltip'leri ekle
    - _Gereksinimler: 3.3_
  
  - [x] 7.3 Share of Voice karşılaştırması uygula
    - Platformları karşılaştıran çubuk grafik oluştur
    - SoV yüzdelerini hesapla ve göster
    - En iyi platformlar için görsel vurgulama ekle
    - _Gereksinimler: 3.4_

- [ ] 8. Marka Bahsetmeleri ve Duygu Analizi
  - [x] 8.1 Marka Bahsetmeleri sayfası oluştur
    - Duygu dağılımıyla sayfa düzeni oluştur
    - Toplam bahsetme sayısını ve duygu dağılımını göster
    - Duygu dağılımı için pasta grafiği göster
    - _Gereksinimler: 4.2_
  
  - [x] 8.2 Bahsetmeler veri tablosu oluştur
    - Sıralanabilir sütunlarla DataTable bileşeni oluştur
    - Bahsetme içeriği, platform, zaman damgası, duygu ve sorguyu göster
    - Sayfalama uygula
    - Platform ve duyguya göre filtreleme ekle
    - _Gereksinimler: 4.4, 18.2, 18.3_
  
  - [x] 8.3 SentimentGauge bileşeni oluştur
    - Dairesel gösterge görselleştirmesi oluştur
    - Kırmızıdan yeşile renk gradyanı uygula
    - Duygu skoruna göre animasyonlu ibre ekle
    - _Gereksinimler: 4.5_
  
  - [x] 8.4 Gerçek zamanlı bahsetme güncellemelerini uygula
    - Mentions tablosu için Supabase gerçek zamanlı aboneliği ayarla
    - Yeni bahsetmeler geldiğinde UI'ı güncelle
    - Yeni bahsetmeler için bildirim ekle
    - _Gereksinimler: 4.3_

- [ ] 9. Rakip Analizi
  - [x] 9.1 Rakip Analizi sayfası oluştur
    - Rakip listesiyle sayfa düzeni oluştur
    - "Rakip Ekle" butonu ekle
    - Metriklerle rakip kartları göster
    - _Gereksinimler: 5.1_
  
  - [x] 9.2 Rakip ekleme formu oluştur
    - Rakip adı ve domain alanlarıyla form oluştur
    - Doğrulama uygula (müşteri başına maksimum 10 rakip)
    - Rakip oluşturma için Server Action oluştur
    - _Gereksinimler: 5.1, 5.2_
  
  - [x] 9.3 Rekabetçi manzara radar grafiği oluştur
    - Recharts kullanarak RadarChart bileşeni oluştur
    - Müşteri ve rakip metriklerini getir
    - Birden fazla seri göster (müşteri + rakipler)
    - Açıklama ve tooltip'ler ekle
    - _Gereksinimler: 5.3_
  
  - [x] 9.4 Boşluk analizini uygula
    - Rakiplerin göründüğü ancak müşterinin görünmediği sorguları bulmak için Server Action oluştur
    - Boşluk analizi sonuçlarını tabloda göster
    - Fırsat skoru hesaplaması ekle
    - _Gereksinimler: 5.5_
  
  - [x] 9.5 Sorgu savaş haritası oluştur
    - Her sorguda hangi markaların göründüğünü gösteren görselleştirme oluştur
    - Isı haritası veya matris görselleştirmesi kullan
    - Sorgu kategorisine göre filtreleme ekle
    - _Gereksinimler: 5.6_

- [ ] 10. Alıntı Adli Tıbbı
  - [x] 10.1 Alıntı Adli Tıbbı sayfası oluştur
    - Alıntı metrikleriyle sayfa düzeni oluştur
    - En çok alıntılanan sayfaları sıralı listede göster
    - Alıntı kaynak türü dağılımını göster
    - _Gereksinimler: 6.1, 6.2_
  
  - [x] 10.2 Otorite haritası görselleştirmesi oluştur
    - Kaynak otoritesi için dağılım grafiği veya balon grafiği oluştur
    - Alıntıları otorite skoruna göre çiz
    - Kaynak detaylarıyla tooltip'ler ekle
    - _Gereksinimler: 6.3_
  
  - [x] 10.3 Alıntı takibini uygula
    - Yeni ve kaybedilen alıntıları takip etmek için Server Action oluştur
    - Trend göstergeleriyle kazanılan vs kaybedilen alıntıları göster
    - Tarih aralığına göre filtreleme ekle
    - _Gereksinimler: 6.4_
  
  - [x] 10.4 Alıntı boşluk analizini oluştur
    - Rakip alıntılarını gösteren karşılaştırma görünümü oluştur
    - Rakiplerin alıntılandığı ancak müşterinin alıntılanmadığı kaynakları vurgula
    - Fırsat skorlaması ekle
    - _Gereksinimler: 6.5_

- [ ] 11. İçerik Optimizasyonları
  - [x] 11.1 İçerik Optimizasyonları sayfası oluştur
    - Kanban panosuyla sayfa düzeni oluştur
    - Üç sütunda optimizasyon kartları göster (Yapılacak, Devam Ediyor, Tamamlandı)
    - _Gereksinimler: 7.3_
  
  - [x] 11.2 KanbanBoard bileşeni oluştur
    - dnd-kit kullanarak sürükle-bırak uygula
    - Başlık, açıklama, etki ve eforla optimizasyon kartları oluştur
    - Sütunlar arasında kart hareketini işle
    - Optimistic güncellemeleri uygula
    - _Gereksinimler: 7.3, 7.4_
  
  - [x] 11.3 Etki vs efor matrisi oluştur
    - 2x2 matris görselleştirmesi oluştur
    - Optimizasyonları etki ve efora göre çiz
    - Detayları görüntülemek için tıklama ekle
    - _Gereksinimler: 7.2_
  
  - [x] 11.4 Hazırlık skoru hesaplamasını uygula
    - Hazırlık skorunu (0-100) hesaplamak için fonksiyon oluştur
    - Optimizasyon kartlarında skoru göster
    - Görsel gösterge ekle (ilerleme çubuğu veya rozet)
    - _Gereksinimler: 7.1_
  
  - [x] 11.5 İçerik boşluk analizini oluştur
    - Eksik içerik alanlarını gösteren görünüm oluştur
    - Boşlukları konu kategorisine göre grupla
    - Öncelik göstergelerini ekle
    - _Gereksinimler: 7.5_

- [ ] 12. Halüsinasyon Tespiti
  - [x] 12.1 Halüsinasyon Tespiti sayfası oluştur
    - Halüsinasyon listesiyle sayfa düzeni oluştur
    - Halüsinasyonları risk seviyesine göre sıralı göster
    - Risk seviyesi rozetlerini göster (kritik, yüksek, orta, düşük)
    - _Gereksinimler: 8.3_
  
  - [x] 12.2 Halüsinasyon detay kartları oluştur
    - Platform, yanlış bilgi, doğru bilgi ve tespit tarihini göster
    - Düzeltme takip durumu ekle
    - Genişletilebilir detayları uygula
    - _Gereksinimler: 8.4_
  
  - [x] 12.3 Kritik halüsinasyon uyarılarını uygula
    - Kritik halüsinasyonları tespit etmek için Server Action oluştur
    - Kritik risk için otomatik olarak uyarılar oluştur
    - Kullanıcılara bildirimler gönder
    - _Gereksinimler: 8.2_
  
  - [x] 12.4 Platforma özel halüsinasyon istatistikleri oluştur
    - Platforma göre halüsinasyonları gösteren grafik oluştur
    - Risk seviyesi dağılımını göster
    - Platform ve risk seviyesine göre filtreleme ekle
    - _Gereksinimler: 8.6_
  
  - [x] 12.5 Düzeltme takibini uygula
    - "Düzeltildi Olarak İşaretle" butonu ekle
    - Halüsinasyon durumunu güncellemek için Server Action oluştur
    - Düzeltme tarihini ve notları takip et
    - _Gereksinimler: 8.5_

- [ ] 13. Uyarılar ve Bildirimler
  - [ ] 13.1 Uyarılar sayfası oluştur
    - Uyarı listesiyle sayfa düzeni oluştur
    - Uyarıları tarihe göre sıralı göster
    - Önem derecesi rozetlerini göster (bilgi, uyarı, kritik)
    - Görüntüleme sırasında uyarıları okundu olarak işaretle
    - _Gereksinimler: 9.5_
  
  - [ ] 13.2 Uyarı kuralı yönetimi oluştur
    - Uyarı kuralları oluşturmak için form oluştur
    - Metrik seçimini destekle (bahsetmeler, duygu, alıntılar, halüsinasyonlar, rakip hareketi)
    - Koşul ve eşik girdileri ekle
    - Kural oluşturma için Server Action oluştur
    - _Gereksinimler: 9.1, 9.4_
  
  - [ ] 13.3 Uyarı kuralı kontrolünü uygula
    - Her 5 dakikada bir uyarı kurallarını kontrol etmek için arka plan işi oluştur
    - Mevcut metrikleri eşiklerle karşılaştır
    - Kurallar tetiklendiğinde uyarılar oluştur
    - _Gereksinimler: 9.2, 9.3_
  
  - [ ] 13.4 Bildirim zili bileşeni oluştur
    - Başlıkta bildirim zili ikonu oluştur
    - Okunmamış sayı rozetini göster
    - Son uyarılarla dropdown göster
    - Yeni uyarılar için gerçek zamanlı güncellemeler ekle
    - _Gereksinimler: 9.3, 9.5_

- [ ] 14. Tarihsel Trend Analizi
  - [ ] 14.1 Tarihsel Trendler sayfası oluştur
    - Takvim ısı haritasıyla sayfa düzeni oluştur
    - Son 90 günün verilerini getir
    - Bahsetmeler, alıntılar ve duygu için trendleri göster
    - _Gereksinimler: 12.1_
  
  - [ ] 14.2 Tarih aralığı seçiciyi uygula
    - Tarih seçici bileşeni oluştur
    - Özel tarih aralığı seçimine izin ver
    - Seçilen aralığa göre grafikleri güncelle
    - _Gereksinimler: 12.2_
  
  - [ ] 14.3 Önce/sonra karşılaştırması oluştur
    - İki tarih aralığı için karşılaştırma görünümü oluştur
    - Yüzde değişimlerini hesapla
    - Yan yana metrikleri göster
    - _Gereksinimler: 12.3_
  
  - [ ] 14.4 Hareketli ortalama hesaplamasını uygula
    - Hareketli ortalamaları hesaplamak için fonksiyon oluştur
    - Trend grafiklerine hareketli ortalama çizgisi ekle
    - Farklı pencere boyutlarını destekle (7 günlük, 30 günlük)
    - _Gereksinimler: 12.4_
  
  - [ ] 14.5 Toplama seçenekleri ekle
    - Günlük, haftalık ve aylık toplama uygula
    - Toplama seçimi için geçiş butonları oluştur
    - Seçilen toplamaya göre grafikleri güncelle
    - _Gereksinimler: 12.6_

- [ ] 15. Kullanıcı Yönetimi ve Yetkilendirme
  - [ ] 15.1 Kullanıcı yönetimi sayfası oluştur (yalnızca admin)
    - Ajanstaki tüm kullanıcıları listelemek için sayfa oluştur
    - Email, rol ve son giriş ile kullanıcı kartları göster
    - "Kullanıcı Davet Et" butonu ekle
    - _Gereksinimler: 10.2_
  
  - [ ] 15.2 Kullanıcı davet formu oluştur
    - Email, rol ve müşteri erişim izinleriyle form oluştur
    - Rol seçimi uygula (admin, editor, viewer)
    - Davet göndermek için Server Action oluştur
    - _Gereksinimler: 10.2_
  
  - [ ] 15.3 Rol tabanlı erişim kontrolünü uygula
    - Kullanıcı izinlerini kontrol etmek için middleware oluştur
    - Viewer rolünü salt okunur erişimle kısıtla
    - Editor rolüne okuma ve düzenleme izni ver
    - Admin rolüne tam erişim ver
    - _Gereksinimler: 10.3, 10.4, 10.5_
  
  - [ ] 15.4 İzin hatası işlemeyi ekle
    - Yetkisiz erişim için hata sayfası oluştur
    - Yardımcı hata mesajı göster
    - Uygun sayfaya yönlendir
    - _Gereksinimler: 10.6_

- [ ] 16. White-Label Yapılandırması
  - [ ] 16.1 White-label formuyla Ayarlar sayfası oluştur
    - Ajans logosu yükleme, birincil renk, ikincil renk ve şirket adıyla form oluştur
    - Renk seçici bileşenleri ekle
    - Form doğrulaması uygula
    - _Gereksinimler: 13.1, 13.2_
  
  - [ ] 16.2 White-label tema uygulamasını uygula
    - White-label ayarlarını saklamak için tema context'i oluştur
    - CSS değişkenlerini kullanarak UI öğelerine özel renkleri uygula
    - Kenar çubuğu ve başlıkta logoyu güncelle
    - _Gereksinimler: 13.3_
  
  - [ ] 16.3 Özel domain yapılandırması ekle
    - Özel domain girişi için form oluştur
    - DNS yapılandırma talimatları ekle
    - Özel domain'i veritabanında sakla
    - _Gereksinimler: 13.4_
  
  - [ ] 16.4 Email bildirimlerine markalama uygula
    - White-label desteğiyle email şablonları oluştur
    - Email'lerde ajans logosu ve renklerini kullan
    - _Gereksinimler: 13.5_

- [ ] 17. Veri Dışa Aktarma ve Raporlama
  - [ ] 17.1 Dışa aktarma işlevselliği oluştur
    - İlgili sayfalara dışa aktarma butonu ekle
    - Format seçimiyle (CSV, PDF, JSON) modal oluştur
    - Veri dışa aktarma için Server Action uygula
    - _Gereksinimler: 14.1, 14.2_
  
  - [ ] 17.2 PDF rapor oluşturmayı uygula
    - Grafikler ve tablolarla PDF şablonu oluştur
    - jsPDF veya Puppeteer gibi kütüphane kullan
    - Biçimlendirilmiş veri ve görselleştirmeleri dahil et
    - _Gereksinimler: 14.3_
  
  - [ ] 17.3 Birden fazla müşteri için toplu dışa aktarma ekle
    - Müşteri seçimi için çoklu seçim oluştur
    - Her müşteri için ayrı dosyalar oluştur
    - İndirme için ZIP arşivi oluştur
    - _Gereksinimler: 14.4, 14.5_
  
  - [ ] 17.4 Dışa aktarma denetim günlüğünü uygula
    - Denetim günlüğü tablosu oluştur
    - Tüm dışa aktarma işlemlerini kullanıcı, zaman damgası ve veri kapsamıyla günlükle
    - Ayarlarda denetim günlüğünü göster
    - _Gereksinimler: 14.6_

- [ ] 18. Arama ve Filtreleme
  - [ ] 18.1 Global arama bileşeni oluştur
    - Başlıkta arama çubuğu oluştur
    - Bahsetmeler, alıntılar ve sorgular arasında gerçek zamanlı arama uygula
    - Arama sonuçlarını dropdown'da göster
    - _Gereksinimler: 18.1, 18.2_
  
  - [ ] 18.2 Gelişmiş filtreleme uygula
    - Birden fazla seçenekle filtre dropdown'ı oluştur
    - Platform, duygu, tarih aralığı ve risk seviyesi filtrelerini destekle
    - Aynı anda birden fazla filtreye izin ver
    - _Gereksinimler: 18.3, 18.4_
  
  - [ ] 18.3 Filtre chip'leri bileşeni oluştur
    - Aktif filtreleri kaldırılabilir chip'ler olarak göster
    - Filtreyi kaldırmak için tıklama ekle
    - Filtreler değiştiğinde sonuçları güncelle
    - _Gereksinimler: 18.5, 18.6_

- [ ] 19. Performans Optimizasyonu
  - [ ] 19.1 React Query önbelleklemeyi uygula
    - Önbellek yapılandırmasıyla React Query istemcisi ayarla
    - Tüm veri getirme için sorgu anahtarları ekle
    - Stale time ve cache time'ı yapılandır
    - _Gereksinimler: 15.3, 15.4_
  
  - [ ] 19.2 Sayfalama ve sonsuz kaydırma ekle
    - Büyük veri tabloları için sayfalama uygula
    - Akışlar için sonsuz kaydırma ekle
    - Limitlerle sorgu performansını optimize et
    - _Gereksinimler: 15.2_
  
  - [ ] 19.3 Grafik render'ını optimize et
    - Grafik memoization'ı uygula
    - Grafik bileşenleri için React.memo kullan
    - Animasyonlar için 60 FPS hedefle
    - _Gereksinimler: 15.5_
  
  - [ ] 19.4 Gerçek zamanlı güncellemeleri optimize et
    - Gerçek zamanlı veriler için seçici yeniden render'lama uygula
    - Pahalı hesaplamalar için React.memo ve useMemo kullan
    - Yeniden render'ları azaltmak için güncellemeleri toplu işle
    - _Gereksinimler: 15.6_
  
  - [ ] 19.5 Yükleme durumları ve iskeletler ekle
    - Yükleme durumları için iskelet bileşenleri oluştur
    - Asenkron işlemlere yükleme göstergeleri ekle
    - Dashboard'un 2 saniyenin altında yüklenmesini sağla
    - _Gereksinimler: 15.1_

- [ ] 20. Hata İşleme ve Doğrulama
  - [ ] 20.1 Form doğrulaması uygula
    - Tüm formlar için Zod şemaları ekle
    - Satır içi hata mesajları göster
    - Gönderimde gerekli alanları doğrula
    - _Gereksinimler: 16.1, 16.2_
  
  - [ ] 20.2 Hata sınırı bileşenleri oluştur
    - Zarif hata işleme için hata sınırı oluştur
    - Kullanıcı dostu hata mesajları göster
    - Yeniden deneme işlevselliği ekle
    - _Gereksinimler: 16.5_
  
  - [ ] 20.3 API hata işlemeyi uygula
    - Hata işleme middleware'i oluştur
    - API hataları için toast bildirimleri göster
    - Ağ hataları için otomatik yeniden deneme ekle
    - _Gereksinimler: 16.3, 16.4_
  
  - [ ] 20.4 Hata günlükleme ekle
    - Geliştirmede hataları konsola günlükle
    - Üretim için hata takip servisi entegre et
    - Kullanıcı bağlamını ve hata yığın izlerini dahil et
    - _Gereksinimler: 16.6_

- [ ] 21. Responsive Tasarım
  - [ ] 21.1 Responsive düzenler uygula
    - Masaüstü (1920px+), tablet (768px-1919px) ve mobil (320px-767px) için kesme noktaları ekle
    - Mobil için optimize edilmiş düzenler oluştur
    - Farklı ekran boyutlarında test et
    - _Gereksinimler: 17.1, 17.2_
  
  - [ ] 21.2 Mobil navigasyon ekle
    - Mobil için hamburger menü uygula
    - Kaydırmalı kenar çubuğu oluştur
    - Dokunma jesti desteği ekle
    - _Gereksinimler: 17.4_
  
  - [ ] 21.3 Grafikleri responsive yap
    - Tüm grafiklerin düzgün şekilde yeniden boyutlandırılmasını sağla
    - Küçük ekranlar için grafik etiketlerini ayarla
    - Mobilde tablolar için kart düzeni kullan
    - _Gereksinimler: 17.5, 17.6_
  
  - [ ] 21.4 Dokunma jesti desteği ekle
    - Navigasyon için kaydırma jestleri uygula
    - Grafikler için yakınlaştırma ekle
    - Dokunmatik cihazlarda test et
    - _Gereksinimler: 17.3_

- [ ] 22. Onboarding ve Yardım
  - [ ] 22.1 Onboarding sihirbazı oluştur
    - İlk kez kullanan kullanıcılar için çok adımlı sihirbaz oluştur
    - Register sonrası ajans ve kullanıcı profilinin ilk kurulum adımlarını onboarding akışına dahil et
    - Müşteri ekleme, platform yapılandırma ve ilk sorgu ekleme adımlarını dahil et
    - İlerleme göstergesi ekle
    - _Gereksinimler: 19.1, 19.2_
  
  - [ ] 22.2 Bağlamsal yardım tooltip'leri ekle
    - Tooltip bileşeni oluştur
    - UI boyunca yardım ikonları ekle
    - Hover'da bağlamsal yardım göster
    - _Gereksinimler: 19.3_
  
  - [ ] 22.3 Yardım dokümantasyonu oluştur
    - Yardım dokümantasyon sayfaları oluştur
    - Dokümantasyona bağlanan "?" ikonu ekle
    - Özellik alanına göre düzenle
    - _Gereksinimler: 19.4_
  
  - [ ] 22.4 Onboarding atlama seçeneği ekle
    - Kullanıcıların onboarding'i atlamasına izin ver
    - Tamamlama veya atlamadan sonra dashboard'a yönlendir
    - Onboarding tamamlanma durumunu sakla
    - _Gereksinimler: 19.5, 19.6_

- [ ] 23. API ve Webhook'lar
  - [ ] 23.1 RESTful API endpoint'leri oluştur
    - Harici entegrasyonlar için API rotaları oluştur
    - Ana varlıklar için CRUD işlemlerini uygula
    - API dokümantasyonu ekle
    - _Gereksinimler: 20.1_
  
  - [ ] 23.2 API kimlik doğrulaması uygula
    - API anahtarı oluşturma ve yönetimi oluştur
    - API anahtarı doğrulama middleware'i ekle
    - API anahtarlarını güvenli şekilde sakla
    - _Gereksinimler: 20.2_
  
  - [ ] 23.3 API hız sınırlaması ekle
    - Hız sınırlaması uygula (dakikada 100 istek)
    - Limit aşıldığında 429 durum kodu döndür
    - Retry-after başlığı ekle
    - _Gereksinimler: 20.3, 20.4_
  
  - [ ] 23.4 Webhook endpoint'i oluştur
    - AI izleme servisi için webhook işleyicisi oluştur
    - Webhook imzalarını doğrula
    - Bahsetme ve alıntı verilerini işle
    - Gerçek zamanlı güncellemeleri tetikle
    - _Gereksinimler: 20.5_
  
  - [ ] 23.5 OpenAPI dokümantasyonu oluştur
    - OpenAPI/Swagger spesifikasyonu oluştur
    - Tüm API endpoint'lerini belgele
    - İstek/yanıt örnekleri ekle
    - Dokümantasyon sayfasını yayınla
    - _Gereksinimler: 20.6_

- [ ] 24. Test ve Kalite Güvencesi
  - [ ]* 24.1 Yardımcı fonksiyonlar için birim testleri yaz
    - Metrik hesaplama fonksiyonlarını test et (AI SoV, duygu, sağlık skoru, trafik değeri)
    - Veri dönüştürme fonksiyonlarını test et
    - Doğrulama şemalarını test et
    - _Gereksinimler: Tümü_
  
  - [ ]* 24.2 Server Action'lar için entegrasyon testleri yaz
    - Müşteri CRUD işlemlerini test et
    - Bahsetme ve alıntı işlemlerini test et
    - Uyarı kuralı kontrolünü test et
    - _Gereksinimler: Tümü_
  
  - [ ]* 24.3 Bileşen testleri yaz
    - Doğrulamalı form bileşenlerini test et
    - Mock veriyle grafik bileşenlerini test et
    - Gerçek zamanlı abonelik bileşenlerini test et
    - _Gereksinimler: Tümü_
  
  - [ ]* 24.4 Uçtan uca test gerçekleştir
    - Tam kullanıcı akışlarını test et (giriş, müşteri ekleme, dashboard görüntüleme)
    - Çok kullanıcılı senaryoları test et
    - Gerçek zamanlı güncellemeleri test et
    - _Gereksinimler: Tümü_

- [ ] 25. Deployment ve Üretim Kurulumu
  - [ ] 25.1 Üretim ortamını yapılandır
    - Üretim Supabase projesini ayarla
    - Ortam değişkenlerini yapılandır
    - Özel domain ayarla
    - _Gereksinimler: 13.4_
  
  - [ ] 25.2 Üretim için build'i optimize et
    - Next.js üretim optimizasyonlarını etkinleştir
    - Görsel optimizasyonunu yapılandır
    - Statik varlıklar için CDN ayarla
    - _Gereksinimler: 15.1_
  
  - [ ] 25.3 İzleme ve günlükleme ayarla
    - Hata takip servisini entegre et
    - Performans izlemeyi ayarla
    - Günlük toplama yapılandır
    - _Gereksinimler: 16.6_
  
  - [ ] 25.4 Deployment dokümantasyonu oluştur
    - Deployment sürecini belgele
    - Ortam değişkeni referansı ekle
    - Sorun giderme kılavuzu dahil et
    - _Gereksinimler: Tümü_

## Notlar

- `*` ile işaretlenmiş görevler, daha hızlı MVP için atlanabilecek opsiyonel test görevleridir
- Her görev izlenebilirlik için belirli gereksinimlere referans verir
- Uygulama, altyapıdan özelliklere doğru artımlı bir yaklaşım izler
- Gerçek zamanlı özellikler, erken doğrulama sağlamak için boyunca entegre edilmiştir
- Performans optimizasyonu baştan itibaren dikkate alınır
- Güvenlik (RLS, kimlik doğrulama, yetkilendirme) sürecin başlarında uygulanır
