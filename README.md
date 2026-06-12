# 🎓 Sınav Yol Arkadaşım

Sınav Yol Arkadaşım, YKS'ye (TYT/AYT) hazırlanan öğrenciler için tasarlanmış akıllı, dinamik ve yapay zeka destekli bir çalışma planlayıcısıdır. Proje, öğrencinin alanına (Sayısal, Sözel, Eşit Ağırlık, Dil) ve hedeflerine özel çalışma programları üretir ve "Hata Kumbarası" sayesinde yapılamayan soruların çözümlerini yapay zeka ile sağlar.

## 🚀 Teknolojiler
- **Mobil Uygulama:** React Native & Expo (TypeScript)
- **Backend Servisi:** Python & FastAPI
- **Veritabanı:** SQLite & SQLAlchemy (ORM)
- **Yapay Zeka Entegrasyonu:** Google Gemini 1.5 Flash (Metin, JSON Ayrıştırma ve Görüntü İşleme / OCR)

## 📌 Özellikler
1. **Akıllı Kayıt ve Yönlendirme:** Öğrenciler hedef sıralamalarını ve alanlarını seçerek uygulamaya giriş yaparlar.
2. **AI Destekli Dinamik Planlama:** Gemini yapay zekası, öğrencinin alanına uymayan konuları ekarte ederek (örn. Sözel öğrencisine Türev sormadan) sadece hedef odaklı, kişiselleştirilmiş 7 günlük bir program çıkartır.
3. **Akordiyon Çalışma Programı:** Günlük görevler anasayfada yer alırken, haftalık görevler "Programım" sayfasında gün gün açılır-kapanır akordiyon listeler halinde sunulur.
4. **Hata Kumbarası (Görüntü İşleme):** Öğrenci yapamadığı bir sorunun fotoğrafını çektiğinde, Gemini vision modeli soruyu OCR ile okur, dersi ve konuyu tespit eder ve detaylı çözümünü sunar.
5. **Gelişmiş İstatistikler:** Tamamlanan sorular, çalışma süreleri ve seri (streak) günleri profil sayfasında grafiklerle takip edilir.

## 🛠 Karşılaşılan Temel Sorunlar ve Çözümlerimiz
Geliştirme sürecinde karşılaştığımız zorluklar ve ürettiğimiz mimari çözümler:

- **Yapay Zeka Çıktılarının Bozulması (JSON Parse Hatası):** 
  *Sorun:* Gemini, bazı durumlarda saf JSON döndürmek yerine sohbetvari metinler (Örn: "İşte planınız:\n```json ...") ekliyordu. Bu da mobil uygulamanın çökmesine yol açıyordu.
  *Çözüm:* Yapay zeka servisimize (`ai_service.py`), dönen metin içerisindeki array veya objeyi regex (`re.search`) ile bulup çıkartan, hata durumunda ise güvenli "fallback" (yedek) datası döndüren sağlam bir parser ekledik.

- **Alanlara (Sayısal/Sözel) Göre Ders Filtreleme:**
  *Sorun:* İlk etapta yapay zeka sözel öğrencisine AYT Matematik görevleri veriyordu.
  *Çözüm:* Veritabanı şemamızı `exam_type` ve `allowed_fields` sütunlarıyla güncelledik. Backend, yapay zekaya prompt atmadan hemen önce MEB Görev Havuzunu öğrencinin alanına göre (`focus_area`) filtreliyor. Böylece AI istese de yanlış dersten görev veremiyor.

- **Navigasyon ve Güvenli Çıkış (Logout) Mimarisi:**
  *Sorun:* Expo Router yapısında, profil ekranından `router.replace('/')` çağrıldığında sistemin kök dizinle Tab dizinini karıştırması ve çıkış yap butonunun çalışmaması.
  *Çözüm:* Giriş (Login) ekranı için tamamen bağımsız bir rotalama (`/login`) oluşturuldu. Mevcut Tab sistemi bu rotadan ayrıldı ve Çıkış Yap işlemi Expo'nun `dismissAll()` metodu ile güçlendirilerek güvenli bir şekilde Login sayfasına yönlendirmesi sağlandı.

- **Görsel Ölçekleme (ScrollView Gizlenme Sorunları):**
  *Sorun:* Profil sayfasının en altındaki Çıkış Yap butonunun Tab Bar'ın altında kalıp görünmemesi.
  *Çözüm:* React Native `ScrollView` componentinin `contentContainerStyle` özelliğine uygun alt boşluklar (`paddingBottom`) eklendi ve tüm kaydırma dinamikleri kusursuzlaştırıldı.

## ⚙️ Kurulum ve Çalıştırma

1. **Gereksinimler:** 
   - Node.js (v18+)
   - Python (3.10+)

2. **Backend Başlatma:**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate   # Windows için
   pip install -r requirements.txt
   ```
   > **Güvenlik Notu:** `backend/.env` dosyası oluşturun ve içerisine `GEMINI_API_KEY=sizin_anahtariniz` değerini ekleyin (Github'a atılmaz, `.gitignore` içindedir). Referans için `.env.example` dosyasına bakabilirsiniz.
   
   Uygulamayı başlatın:
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0
   ```

3. **Mobil Uygulamayı Başlatma:**
   ```bash
   cd mobile
   npm install
   npx expo start -c
   ```
   Emülatörde veya Expo Go mobil uygulamasında karekodu okutarak başlatabilirsiniz.

---
*Bu proje, öğrencilerin sınav maratonundaki psikolojik ve bilişsel yükünü hafifletmek için en son AI teknolojileri ile geliştirilmiştir.*
