# 🎓 Sınav Yol Arkadaşım

Sınav Yol Arkadaşım, YKS'ye (TYT/AYT) hazırlanan öğrenciler için tasarlanmış akıllı, dinamik ve yapay zeka destekli bir çalışma planlayıcısıdır. Proje, öğrencinin alanına (Sayısal, Sözel, Eşit Ağırlık, Dil) ve hedeflerine özel çalışma programları üretir ve "Hata Kumbarası" sayesinde yapılamayan soruların çözümlerini yapay zeka ile sağlar.

🌐 **Canlı Web Uygulaması:** [https://up-school-app-preneur-project.vercel.app/](https://up-school-app-preneur-project.vercel.app/)

---

## 🚀 Teknolojiler
- **Web Arayüzü (Canlı Yayın):** React & Vite (TypeScript/JavaScript) - Vercel üzerinde %100 serverless çalışır.
- **Mobil Uygulama:** React Native & Expo (TypeScript)
- **Veritabanı ve Auth:** Supabase (PostgreSQL & Supabase Auth)
- **Lokal Backend (Geliştirme):** Python & FastAPI & SQLite (SQLAlchemy ORM)
- **Yapay Zeka Entegrasyonu:** Google Gemini 1.5 Flash (Metin, JSON Ayrıştırma ve Görüntü İşleme / OCR)

---

## 🎨 Tasarım Sistemi: Soft Sage-Green Light Theme
Uygulamanın hem web hem de mobil arayüzü, uzun çalışma seanslarında gözü yormaması için modern, hafif ve premium bir **"Soft Sage-Green"** aydınlık temasına dönüştürülmüştür.

### Renk Paleti ve Tasarım Bileşenleri:
- **Arka Plan Rengi:** Adaçayı yeşili tonlarında hafif gri-yeşil `#EBF0EC`
- **Kart ve Paneller:** Saf opak beyaz `#FFFFFF` ve adaçayı renginde ince çerçeveler `#D5DDD6`
- **Yazılar ve Başlıklar:** Yüksek kontrastlı koyu çam yeşili `#1B2A1C`
- **İkincil Etiketler / Yardımcı Metinler:** Muted adaçayı yeşili `#6C7E6E`
- **Dolu Butonlar:** Orman yeşili `#005D32` ve beyaz metinler
- **Aksanlar:** Matematik dersi ve sayaç için mavi `#3498DB`, streak rozeti ve fizik dersi için mercan `#FF9875`

---

## 📌 Temel Özellikler
1. **Akıllı Kayıt ve Yönlendirme:** Öğrenciler hedef sıralamalarını ve alanlarını seçerek uygulamaya giriş yaparlar.
2. **AI Destekli Dinamik Planlama (DARR Algoritması):** Gemini yapay zekası, öğrencinin alanına uymayan konuları ekarte ederek (örn. Sözel öğrencisine Türev sormadan) sadece hedef odaklı, kişiselleştirilmiş 5 günlük bir program çıkartır.
3. **Akordiyon Çalışma Programı:** Günlük görevler anasayfada yer alırken, haftalık görevler "Programım" sayfasında gün gün açılır-kapanır akordiyon listeler halinde sunulur.
4. **Hata Kumbarası (Görüntü İşleme & OCR):** Öğrenci yapamadığı bir sorunun fotoğrafını çektiğinde, Gemini vision modeli soruyu OCR ile okur, dersi ve konuyu tespit eder ve detaylı çözümünü sunar.
5. **Gelişmiş İstatistikler:** Tamamlanan sorular, çalışma süreleri ve seri (streak) günleri profil sayfasında grafiklerle takip edilir.

---

## 🛠️ Sunucusuz (Serverless) Supabase & Gemini Geçişi
Canlı ortamda (Vercel) Python backend çalıştırmanın getirdiği sunucu maliyetleri ve 404/500 yönlendirme hatalarını önlemek amacıyla tüm veritabanı, yetkilendirme ve yapay zeka akışını **%100 client-side sunucusuz (serverless)** mimariye taşıdık.

- **Supabase Auth & Database:** Giriş, kayıt, görev ekleme/güncelleme, hata kumbarası işlemleri ve admin istatistikleri doğrudan tarayıcı üzerinden Supabase istemcisiyle yürütülmektedir.
- **İstemci Tarafı Gemini API:** AI plan kurtarma (rescheduling) ve soru çözme özellikleri doğrudan Google Gemini API'sine istemci taraflı istek atarak yapılır.
- **SQLite Database Sync (Lokal):** Lokal geliştirme ortamında çalışan backend için veritabanı şemaları mevcuttur.

---

## ⚙️ Kurulum ve Çalıştırma

### 1. Supabase Veritabanı Kurulumu (İlk Kurulum)
Veritabanı tablolarını ve RLS politikalarını Supabase üzerinde oluşturmak için:
1. [Supabase Dashboard](https://supabase.com/dashboard) adresine gidip projenizi açın.
2. Sol menüden **SQL Editor** simgesine tıklayın ve **New Query** oluşturun.
3. Proje ana dizinindeki [supabase_setup.sql](file:///c:/Users/06aly/OneDrive/Desktop/up-school-app-preneur-project/supabase_setup.sql) dosyasının içeriğini kopyalayıp editöre yapıştırın ve **Run** tuşuna basarak çalıştırın.

### 2. Web Uygulamasını Çalıştırma (React / Vite)
1. `web` klasörünün içine gidin:
   ```bash
   cd web
   npm install
   ```
2. `web` klasöründe `.env.local` adında bir dosya oluşturun ve Supabase/Gemini anahtarlarınızı girin:
   ```env
   VITE_SUPABASE_URL=https://sizin_supabase_url.supabase.co
   VITE_SUPABASE_ANON_KEY=sizin_anon_key
   VITE_GEMINI_API_KEY=sizin_gemini_api_key
   ```
3. Lokal geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

### 3. Mobil Uygulamayı Başlatma (React Native / Expo)
1. `mobile` klasörüne gidin ve bağımlılıkları kurun:
   ```bash
   cd mobile
   npm install
   ```
2. Expo geliştirici aracını başlatın:
   ```bash
   npx expo start -c
   ```
   Expo Go uygulaması ile karekodu okutarak emülatörde veya gerçek cihazda test edebilirsiniz.

### 4. Lokal Backend Başlatma (FastAPI - Geliştirme Amaçlı)
1. `backend` klasörüne gidip sanal ortam oluşturun ve başlatın:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   ```
2. `.env` dosyası oluşturup `GEMINI_API_KEY` değerini girin.
3. Sunucuyu başlatın:
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0
   ```

---
*Bu proje, öğrencilerin sınav maratonundaki psikolojik ve bilişsel yükünü hafifletmek için en son AI teknolojileri ve modern sunucusuz bulut mimarileri ile geliştirilmiştir.*
