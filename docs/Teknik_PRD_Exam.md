# PRD: Sınav Yol Arkadaşım v1.0 (MVP)

**Sürüm:** 1.0  
**Durum:** Yayında / Tamamlandı  
**Hedef Kitle:** YKS (TYT/AYT) Öğrencileri  

---

## 1. Ürün Vizyonu ve Stratejik Özet
Öğrencinin sınav maratonundaki en büyük düşmanı "belirsizlik" ve "planın bozulmasıyla gelen suçluluk duygusudur." Sınav Yol Arkadaşım, statik bir ders çalışma takvimi yerine, öğrencinin verisine ve alanına göre şekil alan canlı ve esnek bir program sunar. Yapay zeka entegrasyonu ile öğrencilerin yapamadığı soruları analiz eder ve doğrudan onlara özel 5 günlük çalışma planları çıkartır.

---

## 2. Kullanıcı Personası ve User Story
* **Persona:** Mert (17), YKS Sayısal öğrencisi. Haftalık çalışma hedefleri koyuyor ancak plan aksadığında motivasyonu kırılıyor ve programı tamamen aksatıyor.
* **User Story:** *"Bir öğrenci olarak, gün içindeki aksamalarım ne olursa olsun, uygulamanın benim hedeflerime ve alanıma en uygun ders planını yapay zeka ile otomatik güncellemesini istiyorum; böylece her gün neye çalışmam gerektiğini bilerek güne başlayabilirim."*

---

## 3. Fonksiyonel Gereksinimler (Uygulanan)

### FR0: Onboarding (Öğrenciyi Tanıma) Akışı
Sistemin doğru çalışması için kullanıcıyı iyi tanıması gerekir. Kayıt sonrasında kullanıcıdan şu bilgiler alınır:
1. **Hedef Sıralama:** (Örn: İlk 5000, İlk 20000, İlk 50000 vb.)
2. **Alan (Focus Area):** (Sayısal, Sözel, Eşit Ağırlık, Dil)
3. **Haftalık Müsaitlik:** (Örn: 20 Saat, 30 Saat, 40 Saat)
4. **Odak Vakti:** (Sabah 🌅, Öğle ☀️, Akşam 🌙)
*Bu veriler kullanıcının profil tablosuna kaydedilir ve AI ders programı oluşturulurken girdi olarak kullanılır.*

### FR1: AI Destekli Dinamik Ders Programı (Gemini 1.5 Flash)
* **Açıklama:** Statik formüller yerine, Google Gemini API kullanılarak öğrencinin alanına özel (örn. Sözel öğrencisine Matematik-Türev dersi atamayan) 5 günlük esnek bir program üretilir.
* **Akış:** Gemini, onboarding verilerini kullanarak her güne dengeli, bilişsel yükü aşmayan görev başlıkları ve süreleri belirler. Öğrenci görevleri tamamladığında "Bitir" butonuna tıklar ve çözdüğü doğru/yanlış soru sayılerini girerek ilerlemesini kaydeder.

### FR2: Odak Modu (Esnek Kronometre) & Mobil Çalışma
* **Açıklama:** Mobil uygulamada öğrencilerin ders çalışma seanslarını süre bazlı takip edebilmeleri için bir kronometre ve geri sayım sayacı bulunur.
* **Çevrimdışı/Yerel Kayıt:** Mobil uygulamada seanslar ve görev durumları yerel state/async-storage üzerinde tutulur ve sunucuya gönderilir.

### FR3: Hata Kumbarası (Image Processing & Gemini Vision)
* **Açıklama:** Öğrenci yapamadığı veya yanlış çözdüğü bir sorunun fotoğrafını çekip/yükleyip sisteme ekler.
* **AI Analizi:** Gemini 1.5 Flash Vision modeli devreye girerek görseldeki soruyu OCR ile okur, hangi derse ve konuya ait olduğunu tespit eder, zorluk derecesini belirler ve öğrenciye adım adım detaylı çözümü metin olarak üretir. Tüm bu analiz veritabanında saklanır.

---

## 4. Teknik Mimari (Serverless & API)

### 4.1. Veritabanı Şeması (Supabase PostgreSQL)
Proje verileri, Supabase PostgreSQL üzerinde aşağıdaki tablolarla saklanmaktadır:

#### 1. `public.users` (Kullanıcı Profilleri)
* `id`: `uuid` (PK, Auth.users referansı)
* `email`: `text` (Benzersiz e-posta)
* `fullName`: `text` (Ad Soyad)
* `focus_area`: `text` (Sayısal, Sözel, EA, Dil)
* `target_goal`: `text` (Sıralama hedefi)
* `weekly_hours`: `text` (Haftalık çalışma saati)
* `focus_time`: `text` (Sabah, Öğle, Akşam)
* `daily_goal_hours`: `double precision` (Günlük saat hedefi)
* `created_at`: `timestamp`

#### 2. `public.tasks` (Görevler ve Çalışma Programı)
* `id`: `bigint` (PK, Otomatik artan)
* `user_id`: `uuid` (Users.id referansı)
* `title`: `text` (Görev Başlığı)
* `status`: `text` (pending, completed)
* `subject_name`: `text` (Ders adı)
* `estimated_time`: `integer` (Tahmini süre - dakika)
* `actual_time`: `integer` (Harcanan süre - dakika)
* `scheduled_date`: `text` (Planlanan gün/tarih)
* `questions_solved`: `integer` (Çözülen soru sayısı)
* `questions_correct`: `integer` (Doğru sayısı)
* `questions_wrong`: `integer` (Yanlış sayısı)
* `created_at`: `timestamp`

#### 3. `public.errors` (Hata Kumbarası Kayıtları)
* `id`: `bigint` (PK)
* `user_id`: `uuid` (Users.id referansı)
* `image_data`: `text` (Base64 formatında soru görseli)
* `subject_name`: `text` (Ders adı)
* `topic_name`: `text` (Konu adı)
* `difficulty`: `text` (Kolay, Orta, Zor)
* `ocr_text`: `text` (Görselden okunan soru metni)
* `solution_text`: `text` (AI tarafından üretilen adım adım çözüm)
* `created_at`: `timestamp`

### 4.2. Dağıtık Mimari ve Yayına Alma
* **Web Arayüzü (React/Vite):** Vercel üzerinde barındırılmaktadır. Performans, güvenlik ve hız sağlamak amacıyla veritabanı (Supabase) ve Yapay Zeka (Gemini API) bağlantıları tamamen **istemci taraflı sunucusuz (client-side serverless)** olarak kurgulanmıştır.
* **Mobil Uygulama (React Native & Expo):** EAS Build sistemi kullanılarak Android için otomatik APK derlemesi yapılmıştır.
* **Lokal Backend & API (FastAPI):** SQLite entegrasyonu ile geliştirme aşamasında lokal sunucu olarak çalışır. Canlı ortamda (Vercel) `DATABASE_URL` tanımlandığında doğrudan Supabase veritabanına bağlanır.

---

## 5. UI/UX Prensipleri: Soft Sage-Green Light Theme
Göz yorgunluğunu önlemek ve premium bir çalışma deneyimi sunmak amacıyla şu arayüz kuralları uygulanmıştır:
* **Arka Plan:** Rahatlatıcı gri-yeşil tonu `#EBF0EC`
* **Kartlar ve Paneller:** Sade ve temiz beyaz `#FFFFFF`
* **Metinler ve Başlıklar:** Koyu orman/çam yeşili `#1B2A1C`
* **Butonlar ve Birincil Ögeler:** Orman yeşili `#005D32`
* **Aksanlar:** Sayaç için mavi `#3498DB` ve rozetler için mercan rengi `#FF9875`

---

## 6. PRD Kapsamından Çıkarılan Maddeler
MVP sürümünü sadeleştirmek ve en yüksek kararlılıkta çalıştırmak adına aşağıdaki maddeler ilk aşamada kapsam dışı bırakılmıştır:
* **Çok Kanallı Çevrimdışı Çakışma Yönetimi (Conflict Resolution):** Çok detaylı versiyon-kontrollü veritabanı eşitleme protokolü yerine, veriler doğrudan internet bağlantısı varken Supabase üzerinde anlık güncellenir; mobil tarafta ise yerel state önbelleğe alınır.
* **Koyu Tema (Dark Mode):** Uygulama gözü yormayan hafif ve yumuşak "Soft Sage-Green" aydınlık temasına odaklanmıştır.
* **Fixed Formula DARR Algoritması:** Karmaşık matematiksel formüller (`L_new = Σ(...)`) yerine, çok daha esnek, pedagojik kurallara sahip ve bağlamsal planlama yapabilen **Gemini 1.5 Flash üretken AI** modeli tercih edilmiştir.
