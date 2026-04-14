# Teknik PRD Exam

## 1. Modül: DARR (Dynamic Adaptive Road Re-routing) Motoru
Bu motor, uygulamanın beynidir. Sadece bir takvim değil, bir optimizasyon algoritmasıdır.

### A. Algoritma Öncelik Matrisi
Algoritma, bir görev kaçırıldığında (veya "Atla" dendiğinde) şu hiyerarşiyi izleyerek yeniden dağıtım yapar:
- **Fixed Deadlines**: Sınav tarihine kalan gün sayısı ($D_{rem}$).
- **Weight (Ağırlık)**: Konunun sınavdaki çıkma katsayısı ($W_c$).
- **Velocity (Hız)**: Kullanıcının o konudaki geçmiş soru çözme hızı ($V_u$).
- **Cognitive Load (Bilişsel Yük)**: Bir güne üst üste 2 "Zor" konu atanamaz.

### B. Yeniden Dağıtım Formülü (Basitleştirilmiş)
Yeni günlük yük ($L_{new}$), kalan toplam konu hacminin ($V_{total}$) kalan günlere bölünmesiyle değil, ağırlıklı katsayıyla hesaplanır:
$$L_{new} = \frac{\sum (Subject_{volume} \times W_c)}{D_{rem} \times Efficiency_{factor}}$$

## 2. Modül: Veri Yapısı ve Veritabanı Şeması (Schema)
İlişkisel bir model (PostgreSQL tercih edilir) üzerinden ilerleyeceğiz.

| Tablo Adı | Alan (Field) | Tip (Type) | Açıklama |
| :--- | :--- | :--- | :--- |
| Users | uuid | PK (UUID) | Benzersiz kullanıcı ID. |
| | daily_buffer_min | Integer | Kullanıcının kendine ayırdığı esneklik payı (dk). |
| Tasks | task_id | PK (BigInt) | |
| | status | Enum | pending, in_progress, completed, skipped, failed. |
| | priority_score | Float | 0.0 - 1.0 arası algoritma puanı. |
| User_Stats | streak_count | Integer | Ardışık gün sayısı. |
| | last_sync_at | Timestamp | Offline veri tutarlılığı için. |
| Error_Vault | image_url | String (S3) | Hata kumbarasındaki soru görseli. |
| | ocr_text | Text | (Opsiyonel) Görseldeki sorunun text hali. |

## 3. Modül: Offline-First ve Senkronizasyon Stratejisi
İstanbul metrosu gibi "intermittent connectivity" (kesintili bağlantı) olan yerlerde kullanıcı deneyimi sıfır hatayla çalışmalı.

- **Local Storage**: Tüm çalışma seansları ve kronometre verileri SQLite veya Room/CoreData üzerinde tutulur.
- **Synchronization Logic (Conflict Resolution)**: Eğer `local_timestamp > server_timestamp` ise, lokal veri sunucuyu ezer (Override). Eğer kronometre çalışırken internet giderse, AppBackground event'i tetiklendiğinde start_time cihazın sistem saatinden alınarak kaydedilir.
- **Background Tasks**: İnternet geldiği an WorkManager (Android) veya Background Tasks (iOS) üzerinden kuyruktaki veriler (Queue) sunucuya itilir.

## 4. Modül: API Kontratları (Endpoint Tanımları)

### POST `/v1/plan/reschedule`
Kullanıcı planı bozduğunda veya gün sonu geldiğinde tetiklenir.

**Request Body:**
```json
{
  "reason": "skipped_by_user",
  "incomplete_task_ids": [102, 105],
  "current_energy_level": 3,
  "remaining_days": 45
}
```

**Response**: `200 OK` + Yeni optimize edilmiş 7 günlük program objesi.

## 5. Modül: Edge Cases ve Hata Yönetimi (Senior Yaklaşımı)

- **The "Never-Ending" Task**: Kullanıcı kronometreyi açtı ve unuttu.
  - **Çözüm**: Eğer bir görev tahmini süresinin 3 katını aşarsa, sistem "Hala çalışıyor musun?" bildirimi gönderir. Yanıt yoksa seansı otomatik sonlandırır ve "Geçersiz" (Invalid) olarak işaretler.
- **Midnight Reset**: Kullanıcı gece 01:00'de ders çalışıyorsa.
  - **Çözüm**: Uygulama "Güne Devam" modunda kalır. Yeni gün (Morning Briefing) ancak kullanıcı 4 saatlik bir hareketsizlikten sonra veya manuel "Günü Bitir" dediğinde başlar.
- **Low Storage**: Hata kumbarası için fotoğraf çekerken telefon hafızası doluysa.
  - **Çözüm**: Fotoğraf çekilmeden önce `disk_space_check` yapılır, hata verilir ve düşük çözünürlüklü opsiyon sunulur.

## 6. Modül: Observability ve Analytics
Ürünü Unicorn yapan, veriyi okuma şeklimizdir.

- **Funnel Tracking**: `Onboarding_Start` -> `Subject_Selection` -> `First_Pomodoro` -> `Retention_D1`.
- **Churn Predictor**: Eğer bir kullanıcı üst üste 3 gün "Planı Kurtar" (Reschedule) butonuna basıyorsa, `is_at_risk: true` flag'i atanır ve ona özel bir "Motivasyon Briefing"i tetiklenir.
- **Performance Monitoring**: Algoritmanın çalışma süresi (Execution Time) her zaman < 500ms olmalıdır.
- **CPO'dan Developer'a Not**: "Arkadaşlar, UI tarafında 'glossy' efektlerden ziyade, buton tepki sürelerine (input latency) odaklanın. Öğrenci o butona bastığında 100ms içinde tepki almalı. Bu uygulama bir eğlence aracı değil, bir performans aracı."
