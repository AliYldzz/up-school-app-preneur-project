const cleanApiKey = (key?: string) => (key || '').replace(/['"]/g, '').trim();
const GEMINI_API_KEY = cleanApiKey(process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
export interface TaskItem {
  id: number | string;
  title: string;
  subject_name?: string;
  subject?: string;
  estimated_time?: number;
  timeRange?: string;
  status: string;
  priority_score?: number;
  day_offset?: number;
}

export async function rescheduleStudyPlan(
  remainingDays: number,
  targetGoal: string,
  focusArea: string,
  energyLevel: number,
  incompleteTasks: TaskItem[],
  otherTasks: TaskItem[]
): Promise<any[]> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini AI API anahtarı (EXPO_PUBLIC_GEMINI_API_KEY veya GEMINI_API_KEY) ayarlanmamış. Lütfen ortam değişkenlerini kontrol edin.");
  }
  const prompt = `
    Sen YKS (TYT/AYT) öğrencileri için akıllı bir DARR (Dynamic Adaptive Road Re-routing) planlama motorusun.
    Öğrenci son günlerdeki çalışma planını aksattı. Kalan gün sayısı: ${remainingDays}.
    Öğrencinin hedefi: ${targetGoal}, Alanı: ${focusArea}.
    Mevcut Enerji Seviyesi (1-5 arası): ${energyLevel} (1 en yorgun, 5 en enerjik).
    
    Yapılamayan/Aksayan Görevler:
    ${JSON.stringify(incompleteTasks)}
    
    Planlanması Gereken Diğer Görevler:
    ${JSON.stringify(otherTasks)}
    
    Lütfen bu görevleri öğrencinin enerji seviyesini ve kalan gün sayısını dikkate alarak önümüzdeki 5 güne (0 ile 4 arası gün sapmalarıyla) en mantıklı şekilde dağıt.
    
    **KESİN KURALLAR (DİKKATLE UYULACAK):**
    1. Eğer enerji seviyesi düşükse (1 veya 2), daha kolay veya kısa süreli görevleri öne al, zor görevleri hafiflet veya sürelerini kısalt.
    2. Enerji seviyesi yüksekse zor konuları ve yoğun seansları yerleştir.
    3. BİLİŞSEL YÜK DENGESİ: Asla iki 'Zor' konuyu veya iki ağır sayısal dersi peş peşe planlama. Araya mutlaka sözel bir ders (Türkçe) veya hafif bir görev tampon olarak koy.
    4. ZAYIF DERS: Öğrencinin alanı (${focusArea}) için olan kritik görevlerin priority_score değerini her zaman daha yüksek (4.0 - 5.0) tut.
    5. Her görev için yeni bir priority_score (0.0 - 5.0 arası) belirle.
    6. Her görev için önümüzdeki 5 gün için bir gün sapması ("day_offset": 0 ile 4 arasında bir tamsayı) belirle. (0: Bugün, 1: Yarın vb.)
    7. TEKRAR ETME YASAĞI: Listede verilen görevlerin başlıkları aynı ise, bunları mükerrer (duplicate) olarak planlama, tek bir görev olarak birleştir veya birini elenmiş say.
    8. GÜNLÜK GÖREV YÜKÜ LİMİTİ: Her güne (day_offset 0 ile 4) en fazla 2 görev yerleştir. Günlük yükü aşırı yığma.
    
    Yanıtını sadece ve sadece belirtilen JSON formatında ver. Başka hiçbir açıklama, markdown işareti veya ek metin ekleme.
    JSON Formatı:
    [
      {
        "id": GÖREVİN_ORİJİNAL_IDSI,
        "title": "Görev Başlığı",
        "subject_name": "Ders Adı (MATEMATİK, FİZİK, vb.)",
        "estimated_time": GÜNCELLENMİŞ_TAHMİNİ_SÜRE,
        "priority_score": YENİ_HESAPLANAN_ÖNCELİK_PUANI,
        "day_offset": GÜN_SAPMASI
      }
    ]
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error("Gemini AI API request failed.");
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("AI Reschedule Error, falling back:", error);
    // Fallback: distribute tasks across offset days 0-4
    return [...incompleteTasks, ...otherTasks].map((task, idx) => ({
      id: task.id,
      title: task.title,
      subject_name: task.subject_name || task.subject,
      estimated_time: task.estimated_time || 60,
      priority_score: 1.0,
      day_offset: idx % 5
    }));
  }
}

export async function solveAndAnalyzeQuestion(imageBase64: string): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini AI API anahtarı (EXPO_PUBLIC_GEMINI_API_KEY veya GEMINI_API_KEY) ayarlanmamış. Lütfen ortam değişkenlerini kontrol edin.");
  }
  let mimeType = 'image/png';
  let cleanData = imageBase64;

  if (imageBase64.includes(';base64,')) {
    const parts = imageBase64.split(';base64,');
    mimeType = parts[0].replace('data:', '');
    cleanData = parts[1];
  }

  const prompt = `
    Sen YKS öğrencileri için akıllı bir Hata Kumbarası Soru Çözücüsüsün.
    Görseldeki soruyu analiz et:
    1. Sorunun üzerindeki tüm metinleri çıkar (OCR).
    2. Sorunun ders adını (Yalnızca şu değerlerden biri olmalı: MATEMATİK, FİZİK, KİMYA, BİYOLOJİ, TÜRKÇE) ve konu adını (örn: Limit, Elektrostatik, Paragraf Yapısı vb.) tespit et.
    3. Sorunun zorluk seviyesini (Kolay, Orta, Zor) belirle.
    4. Sorunun adım adım detaylı, anlaşılır eğitim çözümünü hazırla.
    
    Yanıtını sadece ve sadece belirtilen JSON formatında ver. Başka hiçbir açıklama, markdown işareti veya ek metin ekleme.
    JSON Formatı:
    {
      "ocr_text": "Sorudaki metinlerin tamamı",
      "subject_name": "DERS_ADI (MATEMATİK, FİZİK vb. değerlerden biri)",
      "topic_name": "Konu Başlığı",
      "difficulty": "Kolay veya Orta veya Zor",
      "solution_text": "Sorunun adım adım detaylı çözümü ve açıklaması"
    }
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanData
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error("Gemini AI OCR request failed.");
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("AI Solve Error, falling back:", error);
    return {
      ocr_text: "Metin okunamadı veya API sınırına takıldı.",
      subject_name: "MATEMATİK",
      topic_name: "Genel Konu",
      difficulty: "Orta",
      solution_text: "Yapay zeka çözümü şu anda oluşturulamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin."
    };
  }
}

export const MEB_TASK_LIBRARY = [
  // MATEMATİK (TYT)
  { id: 1, subject_name: "MATEMATİK", topic: "Temel Kavramlar ve Sayı Kümeleri", level: "Kolay", estimated_time: 40, exam_type: "TYT" },
  { id: 2, subject_name: "MATEMATİK", topic: "Üslü ve Köklü Sayılar", level: "Orta", estimated_time: 45, exam_type: "TYT" },
  { id: 3, subject_name: "MATEMATİK", topic: "Mutlak Değer Kavramı ve Eşitsizlikler", level: "Orta", estimated_time: 50, exam_type: "TYT" },
  { id: 4, subject_name: "MATEMATİK", topic: "Çarpanlara Ayırma", level: "Zor", estimated_time: 60, exam_type: "TYT" },
  { id: 5, subject_name: "MATEMATİK", topic: "Oran-Orantı ve Problemlere Giriş", level: "Orta", estimated_time: 45, exam_type: "TYT" },
  { id: 6, subject_name: "MATEMATİK", topic: "Hız ve Hareket Problemleri", level: "Zor", estimated_time: 60, exam_type: "TYT" },
  
  // MATEMATİK (AYT)
  { id: 7, subject_name: "MATEMATİK", topic: "Fonksiyonlar - Grafik Okuma", level: "Zor", estimated_time: 50, exam_type: "AYT" },
  { id: 8, subject_name: "MATEMATİK", topic: "Trigonometri Başlangıç", level: "Orta", estimated_time: 45, exam_type: "AYT" },
  { id: 9, subject_name: "MATEMATİK", topic: "Türev Alma Kuralları", level: "Zor", estimated_time: 60, exam_type: "AYT" },
  { id: 10, subject_name: "MATEMATİK", topic: "İntegralde Alan Hesaplama", level: "Zor", estimated_time: 60, exam_type: "AYT" },

  // TÜRKÇE (TYT)
  { id: 11, subject_name: "TÜRKÇE", topic: "Sözcükte Anlam ve Cümlede Anlam", level: "Kolay", estimated_time: 30, exam_type: "TYT" },
  { id: 12, subject_name: "TÜRKÇE", topic: "Paragrafta Ana Düşünce", level: "Orta", estimated_time: 40, exam_type: "TYT" },
  { id: 13, subject_name: "TÜRKÇE", topic: "Paragrafın Yapısı (Akışı Bozan Cümle)", level: "Zor", estimated_time: 45, exam_type: "TYT" },
  { id: 14, subject_name: "TÜRKÇE", topic: "Ses Bilgisi (Ünlü Düşmesi, Ünsüz Benzeşmesi)", level: "Kolay", estimated_time: 30, exam_type: "TYT" },
  { id: 15, subject_name: "TÜRKÇE", topic: "Sözcük Türleri (İsim, Sıfat, Zamir, Zarf)", level: "Orta", estimated_time: 45, exam_type: "TYT" },
  { id: 16, subject_name: "TÜRKÇE", topic: "Cümlenin Ögeleri", level: "Orta", estimated_time: 40, exam_type: "TYT" },
  { id: 17, subject_name: "TÜRKÇE", topic: "Yazım Kuralları ve Noktalama İşaretleri", level: "Orta", estimated_time: 35, exam_type: "TYT" },

  // FİZİK (TYT)
  { id: 18, subject_name: "FİZİK", topic: "Fizik Bilimine Giriş ve Madde Özellikleri", level: "Kolay", estimated_time: 30, exam_type: "TYT" },
  { id: 19, subject_name: "FİZİK", topic: "İş, Güç ve Enerji", level: "Orta", estimated_time: 50, exam_type: "TYT" },
  { id: 20, subject_name: "FİZİK", topic: "Isı, Sıcaklık ve Genleşme", level: "Orta", estimated_time: 45, exam_type: "TYT" },
  { id: 21, subject_name: "FİZİK", topic: "Elektrostatik ve Elektrik Akımı", level: "Zor", estimated_time: 60, exam_type: "TYT" },
  { id: 22, subject_name: "FİZİK", topic: "Optik (Yansıma, Düzlem Ayna, Kırılma)", level: "Zor", estimated_time: 60, exam_type: "TYT" },

  // FİZİK (AYT)
  { id: 23, subject_name: "FİZİK", topic: "Kuvvet ve Hareket (Newton'un Yasaları)", level: "Zor", estimated_time: 60, exam_type: "AYT" },
  { id: 24, subject_name: "FİZİK", topic: "Basit Harmonik Hareket", level: "Orta", estimated_time: 45, exam_type: "AYT" },
  { id: 25, subject_name: "FİZİK", topic: "Modern Fizik (Fotoelektrik Olay)", level: "Zor", estimated_time: 50, exam_type: "AYT" },

  // KİMYA (TYT)
  { id: 26, subject_name: "KİMYA", topic: "Kimya Bilimi & Atomun Yapısı", level: "Kolay", estimated_time: 30, exam_type: "TYT" },
  { id: 27, subject_name: "KİMYA", topic: "Periyodik Sistem & Kimyasal Türler", level: "Orta", estimated_time: 45, exam_type: "TYT" },
  
  // KİMYA (AYT)
  { id: 28, subject_name: "KİMYA", topic: "Organik Kimyaya Giriş", level: "Zor", estimated_time: 55, exam_type: "AYT" },

  // BİYOLOJİ (TYT)
  { id: 29, subject_name: "BİYOLOJİ", topic: "Canlıların Ortak Özellikleri & Hücre", level: "Kolay", estimated_time: 30, exam_type: "TYT" },
  { id: 30, subject_name: "BİYOLOJİ", topic: "Canlılar Dünyası & Kalıtım", level: "Orta", estimated_time: 45, exam_type: "TYT" },

  // BİYOLOJİ (AYT)
  { id: 31, subject_name: "BİYOLOJİ", topic: "İnsan Fizyolojisi & Sistemler", level: "Zor", estimated_time: 60, exam_type: "AYT" },
  { id: 32, subject_name: "BİYOLOJİ", topic: "Hücresel Solunum & Fotosentez", level: "Zor", estimated_time: 55, exam_type: "AYT" },

  // EDEBİYAT (AYT)
  { id: 33, subject_name: "EDEBİYAT", topic: "Edebi Sanatlar & Şiir Bilgisi", level: "Kolay", estimated_time: 35, exam_type: "AYT" },
  { id: 34, subject_name: "EDEBİYAT", topic: "Divan Edebiyatı Sanatçıları", level: "Orta", estimated_time: 45, exam_type: "AYT" },
  { id: 35, subject_name: "EDEBİYAT", topic: "Cumhuriyet Dönemi Türk Romanı", level: "Zor", estimated_time: 60, exam_type: "AYT" },

  // TARİH (TYT)
  { id: 36, subject_name: "TARİH", topic: "Tarih ve Zaman", level: "Kolay", estimated_time: 30, exam_type: "TYT" },
  { id: 37, subject_name: "TARİH", topic: "Atatürkçülük ve Türk İnkılabı", level: "Zor", estimated_time: 50, exam_type: "TYT" },

  // COĞRAFYA (TYT)
  { id: 38, subject_name: "COĞRAFYA", topic: "Doğa ve İnsan & Harita Bilgisi", level: "Kolay", estimated_time: 35, exam_type: "TYT" },
  { id: 39, subject_name: "COĞRAFYA", topic: "Türkiye'de Yer Şekilleri ve İklim", level: "Orta", estimated_time: 45, exam_type: "TYT" }
];

export async function generateInitialStudyPlan(
  fullName: string,
  focusArea: string,
  targetGoal: string,
  weeklyHours: string,
  focusTime: string
): Promise<any[]> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini AI API anahtarı (EXPO_PUBLIC_GEMINI_API_KEY veya GEMINI_API_KEY) ayarlanmamış. Lütfen ortam değişkenlerini kontrol edin.");
  }
  const allowedTasks = MEB_TASK_LIBRARY.filter(t => {
    if (focusArea === "Sayısal") {
      return ["MATEMATİK", "FİZİK", "KİMYA", "BİYOLOJİ", "TÜRKÇE"].includes(t.subject_name);
    } else if (focusArea === "Sözel") {
      return ["TÜRKÇE", "EDEBİYAT", "TARİH", "COĞRAFYA"].includes(t.subject_name);
    } else if (focusArea === "Eşit Ağırlık") {
      return ["MATEMATİK", "TÜRKÇE", "EDEBİYAT", "TARİH", "COĞRAFYA"].includes(t.subject_name);
    } else { // Dil
      return ["TÜRKÇE", "MATEMATİK", "TARİH", "COĞRAFYA"].includes(t.subject_name);
    }
  });

  const prompt = `
    Sen YKS (TYT/AYT) sınavına hazırlanan öğrenciler için profesyonel bir rehber öğretmen ve çalışma planlayıcısısın.
    Öğrenci Bilgileri:
    - Ad Soyad: ${fullName}
    - Alan: ${focusArea} (Sayısal, Sözel, Eşit Ağırlık, Dil)
    - Zayıf Dersler: ${targetGoal}
    - Haftalık Çalışma Saati: ${weeklyHours}
    - En Verimli Zaman Dilimi: ${focusTime}
    
    Aşağıda sistemimizde bulunan resmi MEB görev havuzu (Task Library) yer almaktadır:
    ${JSON.stringify(allowedTasks)}
    
    Lütfen bu öğrenci için önümüzdeki 5 günü kapsayan, YKS müfredatına uygun, gerçekçi ve dengeli bir başlangıç ders çalışma programı (görev listesi) hazırla.
    En az 6, en fazla 9 görev seç.
    
    **KESİN KURALLAR (DİKKATLE UYULACAK):**
    1. GÖREV UYDURMAMA: Seçtiğin TÜM görevler SADECE VE SADECE yukarıdaki MEB görev havuzundan alınmalıdır. Listede olmayan yeni görev başlığı uydurma.
    2. TRUVA ATI VE GÜVEN İNŞASI (DAY 0, 1, 2 - HAYATİ): Öğrencinin plana başladığı ilk 3 gün (day_offset: 0, 1 ve 2) tamamen Güven İnşası dönemidir. Bu günlere planlanan tüm görevler sadece öğrencinin zayıf olarak belirtmediği (yani güçlü/nötr olduğu) derslerden seçilmeli ve hepsi istisnasız 'Kolay' seviyede olmalıdır. İlk 3 güne asla zayıf ders görevi, Orta veya Zor seviyede görev yerleştirme!
    3. ZAYIF DERSLERE YAVAŞÇA SIZMA (PROGRESSIVE EXPOSURE - DAY 3 VE SONRASI): Öğrencinin zayıf olduğunu belirttiği derslerin görevlerini plana en erken 3. gün (day_offset: 3) ve sonrasında yavaşça dahil et. Zayıf dersin ilk görevi kesinlikle 'Kolay' seviyede olmalı ve öğrencinin güçlü olduğu derslerin arasına tamponlanmalıdır.
    4. GÜNLÜK DAĞILIM VE BLOK ÇALIŞMA: Bir güne arka arkaya en fazla 2 aynı ders görevi atanabilir. Öğrencinin zihnini taze tutmak için bir günde tek bir derse 3'ten fazla görev yığma ve aralara mutlaka farklı bir ders serpiştir.
    5. BİLİŞSEL YÜK VE MOLA YÖNETİMİ: Asla iki ağır sayısal dersi (Örn: Matematik ve Fizik) veya iki 'Zor' görevi peş peşe koyma.
    6. KRONOLOJİK ZORLUK İLERLEMESİ (PEDAGOJİK MANTIK): Bir dersten (Örn: Matematik) plana birden fazla görev koyacaksan, bu görevlerin gün sapmaları zorluk dereceleriyle uyumlu olmalıdır. Kolay görevin gün sapması (day_offset), aynı dersin Orta veya Zor görevinin gün sapmasından kesinlikle küçük (yani takvimde daha önce) olmalıdır.
    7. KONU ÖN KOŞUL ZİNCİRİ: Sarmal yapı gereği şu ön koşul zincirlerine KESİNLİKLE uyulmalıdır:
       - Matematik: 'Fonksiyonlar' planlanmadan 'Türev'; 'Türev' planlanmadan 'İntegral' konusu asla planlanamaz! (Fonksiyonlar <= Türev <= İntegral gün sapması sıralamasıyla).
       - Fizik: 'Newton\'un Hareket Yasaları' planlanmadan 'Basit Harmonik Hareket' planlanamaz!
       - Kimya: 'Kimya Bilimi & Atomun Yapısı' planlanmadan 'Organik Kimya' planlanamaz!
       - Biyoloji: 'Canlıların Ortak Özellikleri & Hücre' planlanmadan 'İnsan Fizyolojisi & Sistemler' planlanamaz!
    8. GÜNLERE DAĞITIM VE LİMİT: Her görev için 0 ile 4 arasında bir "day_offset" (gün sapması) belirle. (0: Bugün, 1: Yarın, vb.)
    9. TEKRAR ETME YASAĞI (BENZERSİZ GÖREVLER): Havuzdan seçtiğin her bir görevin konusu (topic) benzersiz olmalıdır. 5 günlük planda aynı konuyu/görevi kesinlikle 2 veya daha fazla kez planlama. Her görev en fazla 1 kez seçilebilir.
    10. GÜNLÜK GÖREV YÜKÜ LİMİTİ: Her güne (day_offset 0 ile 4) en fazla 1 veya en fazla 2 adet görev planlayabilirsin. 5 günlük planın tamamı için toplamda en az 5, en fazla 6 görev seç (öğrencinin haftalık çalışma saatine göre makul olsun). Zira her güne sistem tarafından ayrıca 2 adet rutin görev daha eklenecektir.
    
    DİKKAT EDİLECEK ÖRNEK SENARYOLAR (FEW-SHOT PROMPTING):
    - Hatalı Planlama (Zayıf Ders Baskısı): [Matematik-Zor (Zayıf Ders, day_offset: 0), Türkçe-Kolay (day_offset: 0)] -> Hata: İlk güne zayıf ders ve Zor seviye görev konmuş. Zayıf dersler en erken 3. gün (day_offset: 3) gelmelidir.
    - Hatalı Planlama (Sıralama Hatası): [Fizik-Kolay (day_offset: 2), Fizik-Orta (day_offset: 0)] -> Hata: Orta seviye, Kolay seviyeden daha önce planlanmış.
    - Doğru Planlama (Pedagojik Güven & Sızma): [Türkçe-Kolay (Güçlü/Nötr, day_offset: 0), Fizik-Kolay (Güçlü/Nötr, day_offset: 1), Türkçe-Orta (day_offset: 2), Matematik-Kolay (Zayıf Ders, day_offset: 3)] -> Harika: İlk 3 gün güçlü/nötr derslerle güven inşası yapılmış, zayıf olan Matematik dersi 3. gün kolay bir şekilde sızdırılmıştır.

    Yanıtını sadece ve sadece belirtilen JSON formatında ver. Başka hiçbir açıklama, markdown işareti veya ek metin ekleme.
    JSON formatında "title" alanı için havuzdaki "topic" değerinin sonuna parantez içinde zorluk seviyesini ve köşeli parantez içinde sınav türünü ekle: "topic (level) [exam_type]" formatında olmalı (örn: "Temel Kavramlar ve Sayı Kümeleri (Kolay) [TYT]").
    
    JSON Formatı:
    [
      {
        "title": "Görev Başlığı (örn: Temel Kavramlar ve Sayı Kümeleri (Kolay) [TYT])",
        "subject_name": "Ders Adı (MATEMATİK, FİZİK, vb.)",
        "estimated_time": TAHMİNİ_SÜRE_DAKİKA,
        "priority_score": ÖNCELİK_PUANI,
        "day_offset": GÜN_SAPMASI
      }
    ]
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error("Gemini initial plan generation failed.");
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("AI Initial Plan Error, falling back:", error);
    return [
      { title: "Temel Kavramlar ve Sayı Kümeleri (Kolay) [TYT]", subject_name: "MATEMATİK", estimated_time: 40, priority_score: 3.0, day_offset: 0 },
      { title: "Sözcükte Anlam ve Cümlede Anlam (Kolay) [TYT]", subject_name: "TÜRKÇE", estimated_time: 30, priority_score: 4.0, day_offset: 0 },
      { title: "Fizik Bilimine Giriş ve Madde Özellikleri (Kolay) [TYT]", subject_name: "FİZİK", estimated_time: 30, priority_score: 3.0, day_offset: 1 },
      { title: "Üslü ve Köklü Sayılar (Orta) [TYT]", subject_name: "MATEMATİK", estimated_time: 45, priority_score: 4.0, day_offset: 2 },
    ];
  }
}
