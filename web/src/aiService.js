const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').replace(/['"]/g, '').trim();

export async function rescheduleStudyPlan(remainingDays, targetGoal, focusArea, energyLevel, incompleteTasks, otherTasks) {
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
      estimated_time: task.estimated_time || parseInt(task.timeRange) || 60,
      priority_score: 1.0,
      day_offset: idx % 5
    }));
  }
}

export async function solveAndAnalyzeQuestion(imageBase64) {
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
