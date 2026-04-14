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

### FR1: DARR (Dynamic Adaptive Road Re-routing) Algoritması
* **Açıklama:** Kullanıcı bir görevi "Atla" (Skip) dediğinde veya belirlenen sürede bitirmediğinde, sistem kalan müfredatı sınav tarihine kadar olan günlere otomatik dağıtır.
* **Teknik Kriter:** Algoritma, konu ağırlıklarını (Örn: Matematik > Limit, Türev, İntegral) ve kullanıcının geçmiş performans hızını (soru/dakika) parametre olarak almalıdır.
* **Öncelik:** P0 (Kritik)

### FR2: Akıllı Kronometre & Offline Senkronizasyon
* **Açıklama:** Pomodoro tabanlı çalışma takibi.
* **Teknik Kriter:** Uygulama "Background"a düştüğünde veya telefon uçak moduna alındığında (odaklanma için) sayaç kesilmemelidir. Veriler yerel (local) DB'de tutulmalı, internet geldiği an sunucuyla asenkronize (Conflict Resolution ile) eşleşmelidir.

### FR3: Hata Kumbarası (Image Processing)
* **Açıklama:** Yanlış soruların fotoğrafını çekip saklama.
* **Teknik Kriter:** Fotoğraflar cihazda optimize edilerek (sıkıştırılarak) saklanmalı. Etiketleme (Ders, Konu, Zorluk) metadata olarak tutulmalı.

### FR4: İstanbul Modu (Micro-Learning)
* **Açıklama:** Kısa süreli (3-5 dk) tüketilebilecek özet içerikler.
* **Teknik Kriter:** Bu içerikler uygulama ilk açıldığında "Pre-fetch" edilmeli, böylece metroda (offline) anlık erişilebilir olmalı.

---

## 4. Teknik Gereksinimler ve Mimari (Non-Functional)

### 4.1. Veri Modeli (High-Level)
* **User Table:** `user_id`, `exam_date`, `daily_goal_hours`, `streak_count`
* **Task Table:** `task_id`, `subject_id`, `estimated_time`, `actual_time`, `status` (Pending, Completed, Rescheduled)
* **Performance Table:** `date`, `net_count`, `accuracy_rate`

### 4.2. API ve State Management
* **State:** Uygulama, kullanıcının o anki "State"ini (Çalışıyor, Mola, Briefing Bekliyor) global bir state manager (Redux/Bloc vb.) ile takip etmelidir.
* **Latency:** API yanıt süreleri 300ms altında olmalı. "İstanbul Modu" kartları için CDN kullanılmalı.

### 4.3. Edge Cases (Uç Durumlar)
* **Zaman Dilimi Kayması:** Kullanıcı gece 00:00'dan sonra ders çalışırsa, bu veri bir önceki güne mi yoksa yeni güne mi yazılacak? 
  * *Karar:* Kullanıcı uyuyana kadar o gün devam eder ("Logic: Sleep as Reset").
* **Eksik Veri:** Kullanıcı 3 gün uygulamaya girmezse, DARR algoritması "Yığılma" yapmamalı, kullanıcıya *"Bazı konuları feda etme zamanı"* uyarısı çıkarmalı.

---

## 5. UI/UX Prensipleri (Geliştirici İçin)
* **Bilişsel Yük Azaltma:** Ana ekranda asla 3'ten fazla aksiyon (buton) olmamalı.
* **Renk Paleti:** Odaklanmayı bozmayan **"Deep Blue"** ve **"Mint Green"** tonları. Gece çalışması için **"True Black"** Dark Mode desteği.
* **Micro-interactions:** Bir görev tamamlandığında hissedilir bir haptic feedback (titreşim) ve görsel konfeti (hafif düzeyde).

---

## 6. Başarı Metrikleri (Analytics Plan)
* **Event Tracking:** `task_completed`, `plan_rescheduled_click`, `istanbul_mode_card_swipe`
* **Retention:** D1, D7 ve D30 takibi.
* **Analiz:** Kullanıcıların planı ne sıklıkla "Kurtar" (Reschedule) butonuna basarak güncellediği.
