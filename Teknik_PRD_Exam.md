# PRD: Sınav Yol Arkadaşım v1.0 (MVP)

**Sürüm:** 1.0  
**Durum:** Taslak / Teknik İncelemeye Hazır  
**Hedef Kitle:** YKS (TYT/AYT) Öğrencileri  

---

## 1. Ürün Vizyonu ve Stratejik Özet
Öğrencinin sınav maratonundaki en büyük düşmanı "belirsizlik" ve "planın bozulmasıyla gelen suçluluk duygusudur." Bu ürün, statik bir takvim yerine, öğrencinin verisine göre şekil alan yaşayan bir organizma sunar. Hedefimiz, öğrenciye **"Kontrol bende, sen sadece çalış"** mesajını vermektir.

---

## 2. Kullanıcı Personası ve User Story

* **Persona:** Mert (17), İstanbul’da yaşıyor. Günde 2 saati toplu taşımada geçiyor. Bir gün planı aksatınca "battı balık yan gider" diyerek o haftayı bırakma eğiliminde.
* **User Story:** *"Bir öğrenci olarak, gün içindeki aksamalarım ne olursa olsun, uygulamanın benim için en mantıklı yeni rotayı çizmesini istiyorum; böylece her sabah uyandığımda sadece önümdeki 3-4 göreve odaklanabilirim."*

---

## 3. Fonksiyonel Gereksinimler (Teknik Detaylandırılmış)

### FR1: DARR (Dynamic Adaptive Road Re-routing) Motoru
Bu motor, uygulamanın beynidir. Sadece bir takvim değil, bir optimizasyon algoritmasıdır.
* **Açıklama:** Kullanıcı bir görevi "Atla" (Skip) dediğinde veya belirlenen sürede bitirmediğinde, sistem kalan müfredatı sınav tarihine kadar olan günlere otomatik dağıtır.
* **Algoritma Öncelik Matrisi:** Algoritma, yeniden dağıtım yaparken şu hiyerarşiyi izler:
  * **Fixed Deadlines:** Sınav tarihine kalan gün sayısı ($D_{rem}$).
  * **Weight (Ağırlık):** Konunun sınavdaki çıkma katsayısı ($W_c$).
  * **Velocity (Hız):** Kullanıcının o konudaki geçmiş soru çözme hızı ($V_u$).
  * **Cognitive Load (Bilişsel Yük):** Bir güne üst üste 2 "Zor" konu atanamaz.
* **Yeniden Dağıtım Formülü (Basitleştirilmiş):** Yeni günlük yük ($L_{new}$), kalan toplam konu hacminin ($V_{total}$) kalan günlere bölünmesiyle değil, ağırlıklı katsayıyla hesaplanır:
  `L_new = Σ(Subject_volume × W_c) / (D_rem × Efficiency_factor)`
* **Öncelik:** P0 (Kritik)

### FR2: Akıllı Kronometre & Offline-First Senkronizasyon
İstanbul metrosu gibi *intermittent connectivity* (kesintili bağlantı) olan yerlerde kullanıcı deneyimi sıfır hatayla çalışmalıdır.
* **Açıklama:** Pomodoro tabanlı çalışma takibi. Uygulama "Background"a düştüğünde veya uçak moduna alındığında sayaç kesilmemelidir.
* **Local Storage:** Tüm çalışma seansları ve kronometre verileri SQLite veya Room/CoreData üzerinde tutulur.
* **Synchronization Logic (Conflict Resolution):** Eğer `local_timestamp > server_timestamp` ise, lokal veri sunucuyu ezer (Override). Eğer kronometre çalışırken internet giderse, `AppBackground` eventi tetiklendiğinde `start_time` cihazın sistem saatinden alınarak kaydedilir.
* **Background Tasks:** İnternet geldiği an WorkManager (Android) veya Background Tasks (iOS) üzerinden kuyruktaki veriler (Queue) sunucuya asenkronize şekilde iletilir.

### FR3: Hata Kumbarası (Image Processing)
* **Açıklama:** Yanlış soruların fotoğrafını çekip saklama.
* **Teknik Kriter:** Fotoğraflar cihazda optimize edilerek (sıkıştırılarak) saklanmalı. Etiketleme (Ders, Konu, Zorluk) metadata olarak tutulmalı.

### FR4: İstanbul Modu (Micro-Learning)
* **Açıklama:** Kısa süreli (3-5 dk) tüketilebilecek özet içerikler.
* **Teknik Kriter:** Bu içerikler uygulama ilk açıldığında "Pre-fetch" edilmeli, böylece metroda (offline) anlık erişilebilir olmalı.

---

## 4. Teknik Gereksinimler ve Mimari (Non-Functional)

### 4.1. Veri Yapısı ve Veritabanı Şeması (Schema)
İlişkisel bir model (PostgreSQL tercih edilir) üzerinden ilerlenecektir.
| Tablo Adı | Alan (Field) | Tip (Type) | Açıklama |
| :--- | :--- | :--- | :--- |
| **Users** | `uuid` | PK (UUID) | Benzersiz kullanıcı ID. |
| | `daily_buffer_min` | Integer | Kullanıcının kendine ayırdığı esneklik payı (dk). |
| **Tasks** | `task_id` | PK (BigInt) | |
| | `status` | Enum | `pending`, `in_progress`, `completed`, `skipped`, `failed`. |
| | `priority_score`| Float | 0.0 - 1.0 arası algoritma puanı. |
| **User_Stats** | `streak_count` | Integer | Ardışık gün sayısı. |
| | `last_sync_at` | Timestamp | Offline veri tutarlılığı için. |
| **Error_Vault** | `image_url` | String (S3) | Hata kumbarasındaki soru görseli. |
| | `ocr_text` | Text | (Opsiyonel) Görseldeki sorunun text hali. |

*(Ek tablolar: User objesinde `exam_date`, `daily_goal_hours`; Task objesinde `subject_id`, `estimated_time`, `actual_time`; Performance objesinde `date`, `net_count`, `accuracy_rate` gibi alanlar da mevcuttur.)*

### 4.2. API ve State Management
* **State:** Uygulama, kullanıcının o anki "State"ini (Çalışıyor, Mola, Briefing Bekliyor) global bir state manager (Redux/Bloc vb.) ile takip etmelidir.
* **Latency:** API yanıt süreleri 300ms altında olmalı. "İstanbul Modu" kartları için CDN kullanılmalı.
* **API Kontratı - POST `/v1/plan/reschedule`**
  * Kullanıcı planı bozduğunda veya gün sonu geldiğinde tetiklenir.
  * **Request Body:**
    ```json
    {
      "reason": "skipped_by_user",
      "incomplete_task_ids": [102, 105],
      "current_energy_level": 3,
      "remaining_days": 45
    }
    ```
  * **Response:** `200 OK` + Yeni optimize edilmiş 7 günlük program objesi.

### 4.3. Edge Cases ve Hata Yönetimi (Senior Yaklaşımı)
* **Zaman Dilimi Kayması & Midnight Reset:** Kullanıcı gece 01:00'de ders çalışıyorsa, veri yeni güne değil, bir önceki güne yazılır ("Logic: Sleep as Reset"). Uygulama "Güne Devam" modunda kalır. Yeni gün (Morning Briefing) ancak kullanıcı 4 saatlik bir hareketsizlikten sonra veya manuel "Günü Bitir" dediğinde başlar.
* **Eksik Veri (Yığılma Engelleme):** Kullanıcı 3 gün uygulamaya girmezse, DARR algoritması "Yığılma" yapmamalı, kullanıcıya *"Bazı konuları feda etme zamanı"* uyarısı çıkarmalıdır.
* **The "Never-Ending" Task:** Kullanıcı kronometreyi açtı ve unuttu. *Çözüm:* Eğer bir görev tahmini süresinin 3 katını aşarsa, sistem *"Hala çalışıyor musun?"* bildirimi gönderir. Yanıt yoksa seansı otomatik sonlandırır ve "Geçersiz" (Invalid) olarak işaretler.
* **Low Storage:** Hata kumbarası için fotoğraf çekerken telefon hafızası doluysa. *Çözüm:* Fotoğraf çekilmeden önce `disk_space_check` yapılır, kullanıcıya hata verilir ve düşük çözünürlüklü opsiyon sunulur.

---

## 5. UI/UX Prensipleri (Geliştirici İçin)
* **Bilişsel Yük Azaltma:** Ana ekranda asla 3'ten fazla aksiyon (buton) olmamalı.
* **Renk Paleti:** Odaklanmayı bozmayan **"Deep Blue"** ve **"Mint Green"** tonları. Gece çalışması için **"True Black"** Dark Mode desteği.
* **Micro-interactions:** Bir görev tamamlandığında hissedilir bir haptic feedback (titreşim) ve görsel konfeti (hafif düzeyde).
* **CPO'dan Developer'a Not:** *"Arkadaşlar, UI tarafında 'glossy' efektlerden ziyade, buton tepki sürelerine (input latency) odaklanın. Öğrenci o butona bastığında 100ms içinde tepki almalı. Bu uygulama bir eğlence aracı değil, bir performans aracı."*

---

## 6. Observability, Analytics ve Başarı Metrikleri
Ürünü Unicorn yapan, veriyi okuma şeklimizdir.
* **Funnel Tracking:** `Onboarding_Start` -> `Subject_Selection` -> `First_Pomodoro` -> `Retention_D1`
* **Event Tracking:** `task_completed`, `plan_rescheduled_click`, `istanbul_mode_card_swipe`
* **Retention:** D1, D7 ve D30 takibi.
* **Churn Predictor:** Eğer bir kullanıcı üst üste 3 gün "Planı Kurtar" (Reschedule) butonuna basıyorsa, `is_at_risk: true` bayrağı (flag) atanır ve ona özel bir "Motivasyon Briefing"i tetiklenir.
* **Performance Monitoring:** Algoritmanın çalışma süresi (Execution Time) her zaman `< 500ms` olmalıdır.
* **Analiz:** Kullanıcıların planı ne sıklıkla Reschedule butonuna basarak güncellediğinin takibi.
