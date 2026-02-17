# Gereksinimler Dokümanı

## Giriş

GEO (Generative Engine Optimization) Dashboard, ajansların müşterilerinin AI platformlarındaki (ChatGPT, Perplexity, Google AI Overviews, Claude, Bing Copilot) marka görünürlüğünü izlemesi, analiz etmesi ve optimize etmesi için tasarlanmış kapsamlı bir SaaS platformudur. Sistem, çoklu müşteri yönetimi, real-time veri takibi, rakip analizi, alıntı forensics ve halüsinasyon tespiti gibi özellikleri içerir.

## Sözlük

- **Sistem**: GEO Dashboard uygulaması
- **Ajans_Kullanıcısı**: Ajans çalışanı (admin, editor veya viewer rolünde)
- **Müşteri**: Ajansın hizmet verdiği marka/şirket
- **AI_Platformu**: ChatGPT, Perplexity, Google AI Overviews, Claude veya Bing Copilot
- **Mention**: AI platformlarında markanın bahsedilmesi
- **Citation**: AI platformlarının marka hakkında kaynak göstermesi
- **AI_SoV**: AI Share of Voice - AI platformlarındaki görünürlük payı
- **Halüsinasyon**: AI platformlarının marka hakkında yanlış bilgi üretmesi
- **Query**: AI platformlarına yapılan sorgu
- **Supabase**: Backend servisi (authentication, database, real-time)
- **Dashboard**: Ana görünürlük ve metrik ekranı
- **Sentiment_Skoru**: Mention'ların duygu analizi sonucu (-1 ile +1 arası)

## Gereksinimler

### Gereksinim 1: Çoklu Müşteri Yönetimi

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, birden fazla müşterinin verilerini yönetebilmek istiyorum, böylece tüm müşterilerime tek bir platformdan hizmet verebilirim.

#### Kabul Kriterleri

1. WHEN bir Ajans_Kullanıcısı sisteme giriş yaptığında, THE Sistem SHALL tüm müşteri listesini health indicator'ları ile birlikte göstermelidir
2. WHEN bir Ajans_Kullanıcısı yeni müşteri ekle butonuna tıkladığında, THE Sistem SHALL müşteri bilgilerini (isim, domain, logo, sektör) girme formu sunmalıdır
3. WHEN bir Ajans_Kullanıcısı müşteri formu doldurduğunda, THE Sistem SHALL müşteriyi veritabanına kaydetmeli ve müşteri listesine eklemelidir
4. WHEN bir Ajans_Kullanıcısı müşteri seçtiğinde, THE Sistem SHALL tüm dashboard verilerini seçilen müşteriye göre filtrelemelidir
5. THE Sistem SHALL her müşteri için benzersiz bir ID oluşturmalıdır
6. WHEN bir müşteri silindiğinde, THE Sistem SHALL ilişkili tüm verileri (mentions, citations, competitors) cascade delete yapmalıdır

### Gereksinim 2: Dashboard ve Metrik Görüntüleme

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, müşterimin AI platformlarındaki performansını tek bakışta görebilmek istiyorum, böylece hızlı kararlar alabilirim.

#### Kabul Kriterleri

1. WHEN bir Ajans_Kullanıcısı dashboard'a eriştiğinde, THE Sistem SHALL AI_SoV, Total Citations, Sentiment_Skoru ve Estimated Traffic Value metriklerini göstermelidir
2. WHEN dashboard yüklendiğinde, THE Sistem SHALL son 30 günlük Visibility Trends grafiğini çizmelidir
3. WHEN yeni bir mention oluştuğunda, THE Sistem SHALL Live Mentions feed'i real-time olarak güncellemelidir
4. THE Sistem SHALL tüm metrikleri önceki döneme göre yüzde değişim ile birlikte göstermelidir
5. WHEN bir metrik kartına tıklandığında, THE Sistem SHALL detaylı analiz sayfasına yönlendirmelidir
6. THE Sistem SHALL dashboard verilerini 5 saniyede bir otomatik yenilemelidir

### Gereksinim 3: AI Platform Görünürlük Takibi

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, müşterimin hangi AI platformlarında ne kadar görünür olduğunu görebilmek istiyorum, böylece platform-spesifik stratejiler geliştirebilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL ChatGPT, Perplexity, Google AI Overviews, Claude ve Bing Copilot platformlarını desteklemelidir
2. WHEN AI Visibility sayfası açıldığında, THE Sistem SHALL her platform için görünürlük yüzdesini göstermelidir
3. WHEN topic kategorileri yüklendiğinde, THE Sistem SHALL platform x topic heatmap görselleştirmesi sunmalıdır
4. THE Sistem SHALL Share of Voice karşılaştırmasını yüzde değerler ile göstermelidir
5. WHEN bir query analiz edildiğinde, THE Sistem SHALL hangi platformlarda markanın bahsedildiğini listelemelidir
6. THE Sistem SHALL her platform için ayrı mention sayısı ve citation sayısı tutmalıdır

### Gereksinim 4: Marka Bahisleri ve Sentiment Analizi

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, müşterimin AI platformlarında nasıl bahsedildiğini görebilmek istiyorum, böylece reputasyon yönetimi yapabilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL mention'ları positive, neutral ve negative olarak kategorize etmelidir
2. WHEN Brand Mentions sayfası açıldığında, THE Sistem SHALL total mention sayısını ve sentiment dağılımını yüzde olarak göstermelidir
3. WHEN yeni bir mention tespit edildiğinde, THE Sistem SHALL live telemetry feed'e real-time olarak eklemelidir
4. THE Sistem SHALL her mention için platform, timestamp, sentiment ve query bilgilerini saklamalıdır
5. WHEN sentiment analizi yapıldığında, THE Sistem SHALL -1 ile +1 arası Sentiment_Skoru hesaplamalıdır
6. THE Sistem SHALL platform bazlı mention dağılımını pasta grafik ile görselleştirmelidir

### Gereksinim 5: Rakip Analizi

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, müşterimin rakiplerine göre durumunu görebilmek istiyorum, böylece rekabet avantajı sağlayabilirim.

#### Kabul Kriterleri

1. WHEN bir Ajans_Kullanıcısı rakip eklemek istediğinde, THE Sistem SHALL rakip domain ve isim bilgilerini girme formu sunmalıdır
2. THE Sistem SHALL her müşteri için en fazla 10 rakip eklenmesine izin vermelidir
3. WHEN Competitor Analysis sayfası açıldığında, THE Sistem SHALL competitive landscape radar chart göstermelidir
4. THE Sistem SHALL müşteri ve rakipler arasında Share of Voice karşılaştırması yapmalıdır
5. WHEN gap analysis çalıştırıldığında, THE Sistem SHALL rakiplerin göründüğü ancak müşterinin görünmediği query'leri listelemelidir
6. THE Sistem SHALL query battle map'te her query için hangi markaların bahsedildiğini görselleştirmelidir

### Gereksinim 6: Alıntı Forensics

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, müşterimin hangi kaynaklardan alıntılandığını görebilmek istiyorum, böylece kaynak stratejisi geliştirebilirim.

#### Kabul Kriterleri

1. WHEN Citation Forensics sayfası açıldığında, THE Sistem SHALL en çok alıntılanan sayfaları sıralı liste olarak göstermelidir
2. THE Sistem SHALL citation kaynaklarını (Wikipedia, Reddit, review sites, news sites, blogs) kategorize etmelidir
3. WHEN authority map görüntülendiğinde, THE Sistem SHALL kaynak otoritesini domain authority skoruna göre görselleştirmelidir
4. THE Sistem SHALL yeni kazanılan ve kaybedilen citation'ları ayrı ayrı takip etmelidir
5. WHEN citation gap analysis yapıldığında, THE Sistem SHALL rakiplerin alıntılandığı ancak müşterinin alıntılanmadığı kaynakları listelemelidir
6. THE Sistem SHALL her citation için platform, kaynak URL, timestamp ve query bilgilerini saklamalıdır

### Gereksinim 7: İçerik Optimizasyonları

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, müşterimin içeriğini nasıl optimize edeceğime dair öneriler görebilmek istiyorum, böylece AI görünürlüğünü artırabilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL her optimizasyon önerisi için readiness score (0-100) hesaplamalıdır
2. WHEN Content Optimizations sayfası açıldığında, THE Sistem SHALL önerileri impact vs effort matrisinde görselleştirmelidir
3. THE Sistem SHALL optimizasyon kartlarını To Do, In Progress ve Done kolonlarında Kanban tarzı göstermelidir
4. WHEN bir Ajans_Kullanıcısı optimizasyon kartını sürüklediğinde, THE Sistem SHALL kartın durumunu güncellemelidir
5. WHEN content gap analysis yapıldığında, THE Sistem SHALL eksik içerik alanlarını topic kategorilerine göre listelemelidir
6. THE Sistem SHALL her optimizasyon için tahmini impact (Low, Medium, High) ve effort (Low, Medium, High) değerleri atamalıdır

### Gereksinim 8: Halüsinasyon Tespiti

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, AI platformlarının müşterim hakkında yanlış bilgi ürettiği durumları görebilmek istiyorum, böylece reputasyon risklerini yönetebilirim.

#### Kabul Kriterleri

1. WHEN bir halüsinasyon tespit edildiğinde, THE Sistem SHALL halüsinasyonu critical, high, medium veya low risk olarak sınıflandırmalıdır
2. THE Sistem SHALL critical risk halüsinasyonları için otomatik alert oluşturmalıdır
3. WHEN Hallucination Detection sayfası açıldığında, THE Sistem SHALL tüm halüsinasyonları risk seviyesine göre sıralı göstermelidir
4. THE Sistem SHALL her halüsinasyon için platform, yanlış bilgi, doğru bilgi ve tespit tarihi saklamalıdır
5. WHEN bir halüsinasyon düzeltildiğinde, THE Sistem SHALL correction tracking kaydı oluşturmalıdır
6. THE Sistem SHALL platform-specific halüsinasyon istatistiklerini göstermelidir

### Gereksinim 9: Alert ve Bildirim Sistemi

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, önemli değişiklikler olduğunda bilgilendirilmek istiyorum, böylece hızlı aksiyon alabilirim.

#### Kabul Kriterleri

1. WHEN bir Ajans_Kullanıcısı alert rule oluşturduğunda, THE Sistem SHALL rule'u (metric, threshold, condition) veritabanına kaydetmelidir
2. THE Sistem SHALL her 5 dakikada bir alert rule'ları kontrol etmelidir
3. WHEN bir alert rule tetiklendiğinde, THE Sistem SHALL bildirim oluşturmalı ve kullanıcıya göstermelidir
4. THE Sistem SHALL alert türlerini (mention spike, sentiment drop, new citation, hallucination detected, competitor movement) desteklemelidir
5. WHEN bir Ajans_Kullanıcısı alert'i görüntülediğinde, THE Sistem SHALL alert'i "read" olarak işaretlemelidir
6. THE Sistem SHALL her müşteri için ayrı alert rule'ları tutmalıdır

### Gereksinim 10: Kullanıcı Yönetimi ve Yetkilendirme

**Kullanıcı Hikayesi:** Ajans yöneticisi olarak, ekip üyelerine farklı erişim seviyeleri atayabilmek istiyorum, böylece veri güvenliğini sağlayabilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL admin, editor ve viewer rollerini desteklemelidir
2. WHEN bir admin kullanıcı eklemek istediğinde, THE Sistem SHALL email, rol ve müşteri erişim izinleri girme formu sunmalıdır
3. WHERE rol viewer ise, THE Sistem SHALL sadece okuma erişimi vermelidir
4. WHERE rol editor ise, THE Sistem SHALL okuma ve düzenleme erişimi vermelidir
5. WHERE rol admin ise, THE Sistem SHALL tüm işlevlere erişim vermelidir
6. WHEN bir kullanıcı yetkisi olmayan bir sayfaya erişmeye çalıştığında, THE Sistem SHALL erişimi reddetmeli ve hata mesajı göstermelidir

### Gereksinim 11: Supabase Entegrasyonu

**Kullanıcı Hikayesi:** Geliştirici olarak, güvenli ve ölçeklenebilir bir backend altyapısı kullanmak istiyorum, böylece hızlı geliştirme yapabilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL Supabase authentication kullanarak kullanıcı girişi sağlamalıdır
2. THE Sistem SHALL tüm verileri Supabase PostgreSQL veritabanında saklamalıdır
3. WHEN yeni bir mention veya citation oluştuğunda, THE Sistem SHALL Supabase real-time subscriptions kullanarak client'ları güncellemelidir
4. THE Sistem SHALL clients, mentions, citations, competitors, queries, platforms, optimizations, hallucinations, alerts ve users tablolarını içermelidir
5. THE Sistem SHALL Row Level Security (RLS) politikaları kullanarak veri erişimini kısıtlamalıdır
6. WHEN bir kullanıcı veri sorguladığında, THE Sistem SHALL sadece yetkili olduğu müşterilerin verilerini döndürmelidir

### Gereksinim 12: Tarihsel Trend Analizi

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, müşterimin zaman içindeki performans değişimini görebilmek istiyorum, böylece stratejilerin etkisini ölçebilirim.

#### Kabul Kriterleri

1. WHEN Historical Trends sayfası açıldığında, THE Sistem SHALL son 90 günlük veriyi calendar heatmap ile görselleştirmelidir
2. THE Sistem SHALL tarih aralığı seçimi için date picker sunmalıdır
3. WHEN bir Ajans_Kullanıcısı iki tarih aralığı seçtiğinde, THE Sistem SHALL before/after karşılaştırması yapmalıdır
4. THE Sistem SHALL trend analizi için moving average hesaplamalıdır
5. WHEN bir metrik trend gösterildiğinde, THE Sistem SHALL yükseliş veya düşüş yönünü ok işareti ile belirtmelidir
6. THE Sistem SHALL günlük, haftalık ve aylık aggregation seçenekleri sunmalıdır

### Gereksinim 13: White-Label Yapılandırması

**Kullanıcı Hikayesi:** Ajans sahibi olarak, platformu kendi markamla özelleştirebilmek istiyorum, böylece müşterilerime branded deneyim sunabilirim.

#### Kabul Kriterleri

1. WHEN bir admin Settings sayfasına eriştiğinde, THE Sistem SHALL white-label configuration formu göstermelidir
2. THE Sistem SHALL ajans logosu, primary color, secondary color ve company name ayarlarını desteklemelidir
3. WHEN white-label ayarları kaydedildiğinde, THE Sistem SHALL tüm UI elementlerini yeni ayarlara göre güncellemelidir
4. THE Sistem SHALL custom domain yapılandırmasına izin vermelidir
5. THE Sistem SHALL email bildirimlerinde ajans branding'ini kullanmalıdır
6. THE Sistem SHALL white-label ayarlarını veritabanında saklamalı ve her oturumda yüklemelidir

### Gereksinim 14: Veri Export ve Raporlama

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, müşteri verilerini export edebilmek istiyorum, böylece harici raporlar oluşturabilirim.

#### Kabul Kriterleri

1. WHEN bir Ajans_Kullanıcısı export butonuna tıkladığında, THE Sistem SHALL CSV, PDF ve JSON format seçenekleri sunmalıdır
2. THE Sistem SHALL seçilen formatta veriyi oluşturmalı ve indirme başlatmalıdır
3. WHEN PDF export seçildiğinde, THE Sistem SHALL grafikleri ve tabloları içeren formatted rapor oluşturmalıdır
4. THE Sistem SHALL bulk export için birden fazla müşteri seçimine izin vermelidir
5. WHEN bulk export yapıldığında, THE Sistem SHALL her müşteri için ayrı dosya oluşturmalı ve ZIP arşivi sunmalıdır
6. THE Sistem SHALL export işlemlerini audit log'a kaydetmelidir

### Gereksinim 15: Performans ve Ölçeklenebilirlik

**Kullanıcı Hikayesi:** Geliştirici olarak, sistem hızlı ve responsive olmalı, böylece kullanıcı deneyimi kesintisiz olur.

#### Kabul Kriterleri

1. THE Sistem SHALL dashboard'u 2 saniyeden kısa sürede yüklemelidir
2. WHEN büyük veri setleri görüntülendiğinde, THE Sistem SHALL pagination veya infinite scroll kullanmalıdır
3. THE Sistem SHALL API isteklerini React Query ile cache'lemelidir
4. WHEN aynı veri tekrar istendiğinde, THE Sistem SHALL cache'ten sunmalı ve gereksiz network isteği yapmamalıdır
5. THE Sistem SHALL grafik render işlemlerini optimize etmeli ve 60 FPS hedeflemelidir
6. WHEN real-time updates alındığında, THE Sistem SHALL sadece değişen component'leri re-render etmelidir

### Gereksinim 16: Veri Doğrulama ve Hata Yönetimi

**Kullanıcı Hikayesi:** Kullanıcı olarak, hatalı veri girişlerinde anlaşılır mesajlar görmek istiyorum, böylece ne yapacağımı bilebilirim.

#### Kabul Kriterleri

1. WHEN bir form submit edildiğinde, THE Sistem SHALL tüm required field'ları validate etmelidir
2. IF bir validation hatası varsa, THEN THE Sistem SHALL field'ın yanında hata mesajı göstermelidir
3. WHEN bir API isteği başarısız olduğunda, THE Sistem SHALL kullanıcıya anlaşılır hata mesajı göstermelidir
4. THE Sistem SHALL network hatalarında otomatik retry mekanizması uygulamalıdır
5. WHEN kritik bir hata oluştuğunda, THE Sistem SHALL error boundary ile graceful fallback göstermelidir
6. THE Sistem SHALL tüm hataları console'a log'lamalı ve production'da error tracking servisine göndermelidir

### Gereksinim 17: Responsive Tasarım

**Kullanıcı Hikayesi:** Kullanıcı olarak, platformu farklı cihazlarda kullanabilmek istiyorum, böylece her yerden erişebilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL desktop (1920px+), tablet (768px-1919px) ve mobile (320px-767px) breakpoint'lerini desteklemelidir
2. WHEN ekran genişliği 768px'den küçük olduğunda, THE Sistem SHALL mobile-optimized layout göstermelidir
3. THE Sistem SHALL touch gesture'ları (swipe, pinch-to-zoom) desteklemelidir
4. WHEN mobile görünümde menü açıldığında, THE Sistem SHALL hamburger menu kullanmalıdır
5. THE Sistem SHALL tüm grafikleri responsive olarak render etmelidir
6. WHEN tablet görünümde tablo gösterildiğinde, THE Sistem SHALL horizontal scroll veya card layout kullanmalıdır

### Gereksinim 18: Arama ve Filtreleme

**Kullanıcı Hikayesi:** Ajans kullanıcısı olarak, büyük veri setlerinde arama ve filtreleme yapabilmek istiyorum, böylece ihtiyacım olan bilgiyi hızlı bulabilirim.

#### Kabul Kriterleri

1. WHEN bir Ajans_Kullanıcısı search bar'a metin girdiğinde, THE Sistem SHALL ilgili sonuçları real-time olarak filtrelemelidir
2. THE Sistem SHALL mention, citation ve query listelerinde arama yapılmasına izin vermelidir
3. WHEN filter dropdown'ı açıldığında, THE Sistem SHALL platform, sentiment, date range ve risk level filtrelerini sunmalıdır
4. THE Sistem SHALL birden fazla filtrenin aynı anda uygulanmasına izin vermelidir
5. WHEN filtreler uygulandığında, THE Sistem SHALL aktif filtreleri chip component'leri ile göstermelidir
6. WHEN bir filter chip'i kaldırıldığında, THE Sistem SHALL o filtreyi kaldırmalı ve sonuçları güncellemelidir

### Gereksinim 19: Onboarding ve Yardım

**Kullanıcı Hikayesi:** Yeni kullanıcı olarak, platformu nasıl kullanacağımı öğrenebilmek istiyorum, böylece hızlı başlayabilirim.

#### Kabul Kriterleri

1. WHEN bir kullanıcı ilk kez giriş yaptığında, THE Sistem SHALL onboarding wizard başlatmalıdır
2. THE Sistem SHALL onboarding wizard'da müşteri ekleme, platform yapılandırma ve ilk query ekleme adımlarını içermelidir
3. WHEN bir Ajans_Kullanıcısı help icon'a tıkladığında, THE Sistem SHALL contextual help tooltip göstermelidir
4. THE Sistem SHALL her sayfada "?" icon ile help documentation'a erişim sunmalıdır
5. WHEN onboarding tamamlandığında, THE Sistem SHALL kullanıcıyı dashboard'a yönlendirmelidir
6. THE Sistem SHALL onboarding'i skip etme seçeneği sunmalıdır

### Gereksinim 20: API Entegrasyonları

**Kullanıcı Hikayesi:** Geliştirici olarak, harici sistemlerle entegrasyon yapabilmek istiyorum, böylece veri akışını otomatikleştirebilirim.

#### Kabul Kriterleri

1. THE Sistem SHALL RESTful API endpoint'leri sunmalıdır
2. WHEN bir API isteği yapıldığında, THE Sistem SHALL API key ile authentication gerektirmelidir
3. THE Sistem SHALL API rate limiting (100 request/minute) uygulamalıdır
4. WHEN rate limit aşıldığında, THE Sistem SHALL 429 status code ve retry-after header döndürmelidir
5. THE Sistem SHALL webhook'lar aracılığıyla event notification'ları desteklemelidir
6. THE Sistem SHALL API documentation'ı OpenAPI (Swagger) formatında sunmalıdır
