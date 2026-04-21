# YKS Sınav Yol Arkadaşım: Kapsamlı LMS Geliştirme Planı

Bu belge, mevcut `Teknik_PRD_Exam.md` dökümanındaki gereksinimleri temel alarak, bir Eğitim Yönetim Sisteminde (LMS) standart olarak bulunması gereken ek modüllerle zenginleştirilmiş geliştirme yol haritasını sunmaktadır.

## 1. Mimari ve Veri Akışı (Sistem Mimarisi)

Aşağıdaki akış şeması, sistemin temel bileşenleri arasındaki veri alışverişini gösterir:

```mermaid
graph TD
    A[Mobil İstemci / Offline-First\nFlutter & Local DB] -->|Senkronizasyon| B(FastAPI Backend)
    B --> C[(PostgreSQL\nAna Veritabanı)]
    B --> D[(Redis\nCache & Hızlandırma)]
    A -->|Hata Kumbarası Görselleri| E[AWS S3 / Firebase Cloud Storage]
    B -->|Asenkron İşler| F[Celery Worker\nArka Plan İşlemleri]
    F -->|Bildirim & OCR| A
```

## 2. Standart Bir LMS'te Olması Gereken Ek Özellikler (Gap Analysis)

Mevcut PRD incelendiğinde algoritma odaklı özellikler (DARR, Offline, Hata Kumbarası) uygulamanın temel değer önerisini oluşturuyor. Ancak sistemin eksiksiz ve sürdürülebilir bir LMS (Öğrenim Yönetim Sistemi) kalitesine ulaşabilmesi için aşağıdaki yapıtaşlarının da mimariye eklenmesi gerekir.

| Modül Adı | Mevcut Durum | LMS Gereksinimi | Öncelik (Priority) |
| :--- | :--- | :--- | :--- |
| **Ölçme & İstatistik** | Sadece streak ve stat var | TYT/AYT puanı hesaplama, zayıflık analizi, zamanlı deneme sınavı modülü | 🔴 Yüksek |
| **Gelişmiş İçerik (CMS)** | PRD'de eksik | Yöneticilerin/Öğretmenlerin arayüzden içerik ve soru yükleyebilmesi | 🔴 Yüksek |
| **Kullanıcı & Rol Yönetimi** | Basit yetkilendirme | OAuth, RBAC (Öğrenci, Öğretmen, Admin) Hiyerarşisi | 🔴 Yüksek |
| **Hedef Belirleme** | PRD'de eksik | Üniversite hedefine uzaklık grafikleri ve motivasyon barları | 🟡 Orta |
| **Mentörlük Paneli** | Bireysel | Rehber öğretmenin öğrenci ilerlemesini görebileceği admin web paneli | 🟡 Orta |
| **Abonelik Sistemi** | Belirsiz | Freemium modeli, In-app purchase (Iyzico/RevenueCat) | 🟡 Orta |
| **Oyunlaştırma (Gamification)** | Streak mevcut | Rozetler (Örn: 5 gündür aksatmadın), Liderlik Tabloları | 🟢 Düşük |

## 3. DARR Algoritması Çalışma Akışı (Flowchart)

Kullanıcı planda bir aksama yaşadığında arka planda çalışan sistemin akışı:

```mermaid
sequenceDiagram
    participant User as Öğrenci (Mobil)
    participant API as FastAPI (Backend)
    participant Redis as Önbellek
    participant DB as PostgreSQL
    participant DARR as Algoritma Motoru

    User->>API: POST /v1/plan/reschedule (Görev atlandı/yapılamadı)
    API->>Redis: İstek oranını kontrol et (Rate Limit)
    API->>DB: Kalan konuları ve profile ait istatistikleri getir
    DB-->>API: Kat sayılar (W_c, V_u, D_rem) döndürüldü
    API->>DARR: Bilişsel yük matrisine göre yeniden hesapla
    DARR-->>API: Yeni 7 günlük optimize edilmiş task listesi
    API->>DB: Eski planı 'skipped' yap, yenisini Task'a kaydet
    API-->>User: Yeni planı JSON olarak dön
    User->>User: UI güncellenir & Haptic Feedback verilir
```

## 4. Geliştirme Yol Haritası (Gantt Şeması ve Fazlar)

Projeyi test edilebilir seviyelerde tutmak adına 14 Haftalık bir süreç kurgulanmıştır:

```mermaid
gantt
    title Sınav Yol Arkadaşım - MVP Geliştirme Takvimi
    dateFormat  YYYY-MM-DD
    axisFormat  Hafta %W
    
    section Faz 1: Altyapı
    Veritabanı Şemaları & FastAPI      :a1, 2026-05-01, 14d
    Auth & JWT Kurulumu                :a2, after a1, 7d
    
    section Faz 2: DARR Motoru
    Mock Verilerin Eklenmesi           :b1, 2026-05-15, 7d
    Core Algoritma (W_c, D_rem vs.)    :b2, after b1, 14d
    
    section Faz 3: Mobil & Offline
    Flutter ile Temel UI İnşası        :c1, 2026-05-29, 14d
    Local DB & Akıllı Kronometre       :c2, after c1, 14d
    
    section Faz 4: İçerik & Panel
    Hata Kumbarası Kamera & Yükleme    :d1, 2026-06-26, 7d
    Web CMS Paneli Geliştirilmesi      :d2, after d1, 7d
    
    section Faz 5: Ölçme & Bildirim
    Deneme Net Girme & Hedef Modülü    :e1, 2026-07-10, 7d
    Push Notifications (FCM)           :e2, after e1, 7d
    
    section Faz 6: Test & Sürüm
    Bugfix & API Performans Testleri   :f1, 2026-07-24, 7d
    Alpha Launch (TestFlight/Beta)     :f2, after f1, 7d
```

### Detaylı Faz Açıklamaları:
* **Faz 1 (Temel Altyapı - 1. ve 2. Hafta):** PRD'deki veritabanı tablolarının (Users, Tasks, User_Stats vb. dahil) çıkarılması, Docker ile mimari kurulumu, sisteme giriş (Login) akışları.
* **Faz 2 (DARR Yapıtaşı - 3. - 5. Hafta):** Matematiksel algoritma formüllerinin (Bilişsel Yük, Ağırlık) backend'e dökülmesi ve kritik Edge Case senaryolarının (Gece vardiyası, Midnight Reset vb.) Unit Test senaryolarıyla kapatılması.
* **Faz 3 (Offline Deneyim - 6. - 8. Hafta):** İnternet kopmalarına dayanıklı Local Storage destekli UI, Pomodoro/Kronometre ekranları ve çakışma çözen (conflict resolving) senkronizasyon araçları.
* **Faz 4 (Görsel İçerik - 9. ve 10. Hafta):** Etkileşimli CMS (Web) panelinin yapılıp "İstanbul Modu" verilerinin bağlanması. Hata kumbarası görsellerinin S3'e ulaştırılması.
* **Faz 5 (Ölçme Değerlendirme - 11. ve 12. Hafta):** Rozet, deneme sonuç testleri (AYT/TYT simulasyon arayüzü), geri bildirim döngüleri. *Hala çalışıyor musun?* gibi notification uyarılarının entegresi.
* **Faz 6 (Alpha Çıkışı - 13. ve 14. Hafta):** API hız optimizasyonu (300ms altı kuralı) ve belirlenen ilk çekirdek kullanıcı kitlesiyle beta sürüm izleme denemeleri.

---

## 5. Tavsiye Edilen Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji / Framework | Tercih Nedeni |
| :--- | :--- | :--- |
| **Backend API** | FastAPI (Python) | PRD'ye tam uyumlu. Algılatmalar, optimizasyon hesapları (Python) ve asenkron operasyonlar için mükemmel bir iskelet. Çok hızlı. |
| **Veritabanı** | PostgreSQL | İlişkisel veriler, bağımlılıklar (Örn: Tasks, Exams) için altın standart. |
| **Cache (Önbellek)** | Redis | API isteklerindeki hızı 300ms altına düşürmek için gerekli. |
| **Mobil Uygulama** | Flutter | Tek kod bloğu ile iOS/Android çıkışı. Offline-First yapısı (Hive vb. ile) PRD'nin çevrimdışı önceliği için harika olur. |
| **Medya & CDN** | AWS S3 / Firebase Storage | Yanlış soruların resimleri, "İstanbul Modu" imajlarını barındırma işlemleri. |
| **CMS Web Paneli** | React.js & TailwindCSS | Rehber Öğretmenler ve Editörler için hafif, çok temiz yönetim paneli. |
| **Görev Dağıtıcı** | Celery | Öğrencinin test analizleri hesaplanırken asenkron işlem için; veya fotoğraflara OCR özelliği gelirse sistemi tıkamaması için. |
