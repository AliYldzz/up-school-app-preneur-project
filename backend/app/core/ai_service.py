import urllib.request
import urllib.error
import json
import re
import time
from typing import List, Dict, Any, Tuple
from app.core.config import GEMINI_API_KEY

def call_gemini_api(payload: Dict[str, Any]) -> str:
    """Gemini API'sine ham HTTP POST isteği gönderir (3 kez deneme/retry mekanizması ile)"""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        raise ValueError("Gemini API Anahtarı eksik veya geçersiz.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    max_retries = 4
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                text_response = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return text_response
        except urllib.error.HTTPError as e:
            # Geçici servis hatalarında (503, 429) bekle ve tekrar dene
            if e.code in [429, 503] and attempt < max_retries - 1:
                sleep_time = (attempt + 1) * 5
                print(f"[Gemini API] Geçici hata ({e.code}). {sleep_time} saniye sonra tekrar deneniyor... (Deneme {attempt+1}/{max_retries})")
                time.sleep(sleep_time)
                continue
            raise e
        except Exception as e:
            if attempt < max_retries - 1:
                sleep_time = (attempt + 1) * 5
                print(f"[Gemini API] Beklenmedik hata. {sleep_time} saniye sonra tekrar deneniyor... (Deneme {attempt+1}/{max_retries})")
                time.sleep(sleep_time)
                continue
            raise e

def clean_base64_image(base64_str: str) -> Tuple[str, str]:
    """Base64 veri başlığını (data:image/jpeg;base64,) temizler ve mime type'ı döner"""
    mime_type = "image/jpeg"
    data = base64_str
    
    if "," in base64_str:
        header, data = base64_str.split(",", 1)
        match = re.search(r"data:([^;]+);base64", header)
        if match:
            mime_type = match.group(1)
            
    # Boşlukları ve satır sonlarını temizle
    data = data.replace("\n", "").replace("\r", "").strip()
    return mime_type, data

def parse_gemini_json(text: str, fallback_data: Any) -> Any:
    """Yapay zekadan dönen bozuk veya markdown içeren JSON'ı güvenli şekilde okur"""
    try:
        text = text.strip()
        # Regex ile köşeli parantez (liste) veya süslü parantez (obje) içindeki kısmı bul
        import re
        match = re.search(r'(\[.*\]|\{.*\})', text, re.DOTALL)
        if match:
            text = match.group(1)
        return json.loads(text.strip())
    except Exception as e:
        print(f"[Gemini API JSON Error] Parse edilemedi: {e}. Dönülen metin: {text}")
        return fallback_data

def generate_initial_study_plan(
    fullName: str,
    focus_area: str,
    target_goal: str,
    weekly_hours: str,
    focus_time: str,
    available_tasks: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Yeni kayıt olan öğrenciye özel YKS çalışma planı oluşturur (Gemini 1.5 Flash)"""
    
    task_library_json = json.dumps(available_tasks, ensure_ascii=False) if available_tasks else "[]"
    
    prompt = f"""
    Sen YKS (TYT/AYT) sınavına hazırlanan öğrenciler için profesyonel bir rehber öğretmen ve çalışma planlayıcısısın.
    Öğrencinin bilgileri:
    - Ad Soyad: {fullName}
    - Alan: {focus_area}
    - Zayıf Dersler (TYT & AYT): {target_goal}
    - Haftalık Çalışma Saati: {weekly_hours}
    - En Verimli Zaman Dilimi: {focus_time}
    
    Aşağıda sistemimizde bulunan resmi MEB görev havuzu (Task Library) yer almaktadır:
    {task_library_json}

    Lütfen bu öğrenci için önümüzdeki 5 günü kapsayan, YKS müfredatına uygun, gerçekçi ve dengeli bir çalışma planı (görev listesi) hazırla.
    En az 5, en fazla 7 görev seç.

    **KESİN KURALLAR (DİKKATLE UYULACAK):**
    1. SIFIRDAN GÖREV UYDURMA: Seçtiğin TÜM görevler SADECE VE SADECE yukarıdaki MEB görev havuzundan alınmalıdır. Listede olmayan bir görev ID'si uydurma.
    2. TRUVA ATI VE GÜVEN İNŞASI (DAY 0, 1, 2 - HAYATİ): Öğrencinin plana başladığı ilk 3 gün (day_offset: 0, 1 ve 2) tamamen Güven İnşası (Confidence Building) dönemidir. Bu günlere planlanan TÜM görevler sadece öğrencinin zayıf olarak belirtmediği (yani güçlü/nötr olduğu) derslerden seçilmeli ve hepsi İSTİSNASIZ 'Kolay' seviyede olmalıdır. İlk 3 güne asla zayıf ders görevi, Orta veya Zor seviyede görev yerleştirme!
    3. ZAYIF DERSLERE YAVAŞÇA SIZMA (PROGRESSIVE EXPOSURE - DAY 3 VE SONRASI): Öğrencinin zayıf olduğunu belirttiği derslerin görevlerini plana en erken 3. gün (day_offset: 3) ve sonrasında yavaşça dahil et. Zayıf dersin ilk görevi kesinlikle 'Kolay' seviyede ve kısa süreli (20-30 dakika) bir mikro-görev olmalı, öğrencinin güçlü olduğu derslerin arasına tamponlanmalıdır.
    4. GÜNLÜK DAĞILIM VE BLOK ÇALIŞMA: Bir güne arka arkaya en fazla 2 aynı ders görevi atanabilir (Örn: Matematik -> Matematik). Öğrencinin zihnini taze tutmak için bir günde tek bir derse 3'ten fazla görev yığma ve aralara mutlaka farklı bir ders serpiştir.
    5. BİLİŞSEL YÜK VE MOLA YÖNETİMİ: Asla iki ağır sayısal dersi (Örn: Matematik ve Fizik) veya iki "Zor" görevi peş peşe koyma.
    6. KRONOLOJİK ZORLUK İLERLEMESİ (PEDAGOJİK MANTIK): Bir dersten (Örn: Matematik) plana birden fazla görev koyacaksan, bu görevlerin gün sapmaları zorluk dereceleriyle uyumlu olmalıdır. Kolay görevin gün sapması (day_offset), aynı dersin Orta veya Zor görevinin gün sapmasından kesinlikle küçük (yani takvimde daha önce) olmalıdır.
    7. KONU ÖN KOŞUL ZİNCİRİ (EŞ ZAMANLI VE HIYERARŞİK İLERLEME): TYT ve AYT dersleri eş zamanlı paralel yürütülebilir (Örn: TYT Problemler ile AYT Logaritma aynı günlerde planlanabilir). Ancak sarmal yapı gereği şu ön koşul zincirlerine KESİNLİKLE uyulmalıdır:
       - Matematik: 'Fonksiyonlar' konusu planlanmadan 'Türev'; 'Türev' planlanmadan 'İntegral' konusu asla planlanamaz! (Bu konuların gün sapmaları: Fonksiyonlar <= Türev <= İntegral şeklinde olmalıdır).
       - Fizik: 'Newton\'un Hareket Yasaları' planlanmadan 'Basit Harmonik Hareket' planlanamaz!
       - Kimya: 'Kimya Bilimi & Atomun Yapısı' planlanmadan 'Organik Kimya' planlanamaz!
       - Biyoloji: 'Canlıların Ortak Özellikleri & Hücre' planlanmadan 'İnsan Fizyolojisi & Sistemler' planlanamaz!
    8. GÜNLERE DAĞITIM VE LİMİT (ÇOK ÖNEMLİ): Her görev için 0 ile 4 arasında bir "day_offset" (gün sapması) belirle. (0: Bugün, 1: Yarın, 2: Sonraki gün vb.) AYNI GÜNE (aynı day_offset) asla 2'den fazla ders görevi atama (rutinler hariç). Her gün için öğrenciye otomatik olarak "30 Paragraf Sorusu (35 dk)" ve "20 Problem Sorusu (30 dk)" rutin olarak atanacaktır (toplam 65 dk rutin). Bu yüzden seçtiğin havuz görevlerinin günlük toplam süresi 80-110 dakikayı GEÇMEMELİDİR. Görevleri 5 güne (0, 1, 2, 3, 4) dengeli şekilde yay!

    DİKKAT EDİLECEK ÖRNEK SENARYOLAR (FEW-SHOT PROMPTING):
    - Hatalı Planlama (Zayıf Ders Baskısı): [Matematik-Zor (Zayıf Ders, day_offset: 0), Türkçe-Kolay (day_offset: 0)] -> Hata: İlk güne zayıf ders ve Zor seviye görev konmuş. Zayıf dersler en erken 3. gün (day_offset: 3) gelmelidir.
    - Hatalı Planlama (Sıralama Hatası): [Fizik-Kolay (day_offset: 2), Fizik-Orta (day_offset: 0)] -> Hata: Orta seviye, Kolay seviyeden daha önce planlanmış.
    - Doğru Planlama (Pedagojik Güven & Sızma): [Türkçe-Kolay (Güçlü/Nötr, day_offset: 0), Fizik-Kolay (Güçlü/Nötr, day_offset: 1), Türkçe-Orta (day_offset: 2), Matematik-Kolay (Zayıf Ders, day_offset: 3)] -> Harika: İlk 3 gün güçlü/nötr derslerle güven inşası yapılmış, zayıf olan Matematik dersi 3. gün kolay bir şekilde sızdırılmıştır.

    Yanıtını sadece ve sadece belirtilen JSON dizisi formatında ver. Başka hiçbir açıklama, markdown işareti veya ek metin ekleme.
    JSON Formatı:
    [
      {{
        "template_id": <Seçtiğin görevin havuzdaki id değeri (integer)>,
        "priority_score": 1.0,
        "day_offset": 0
      }}
    ]
    """

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.6
        }
    }
    
    response_text = call_gemini_api(payload)
    fallback = [
        {"template_id": 1, "priority_score": 5.0, "day_offset": 0},
        {"template_id": 2, "priority_score": 4.5, "day_offset": 1},
        {"template_id": 3, "priority_score": 4.0, "day_offset": 2}
    ]
    return parse_gemini_json(response_text, fallback)

def reschedule_study_plan(
    remaining_days: int,
    target_goal: str,
    focus_area: str,
    energy_level: int,
    incomplete_tasks: List[Dict[str, Any]],
    other_tasks: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Aksayan görevleri ve enerji seviyesini dikkate alarak yapay zeka ile planı yeniden düzenler"""
    
    prompt = f"""
    Sen YKS (TYT/AYT) öğrencileri için akıllı bir DARR (Dynamic Adaptive Road Re-routing) planlama motorusun.
    Öğrenci son günlerdeki çalışma planını aksattı. Kalan gün sayısı: {remaining_days}.
    Öğrencinin hedefi: {target_goal}, Alanı: {focus_area}.
    Mevcut Enerji Seviyesi (1-5 arası): {energy_level} (1 en yorgun, 5 en enerjik).
    
    Yapılamayan/Aksayan Görevler:
    {json.dumps(incomplete_tasks, ensure_ascii=False)}
    
    Planlanması Gereken Diğer Görevler:
    {json.dumps(other_tasks, ensure_ascii=False)}
    
    Lütfen bu görevleri öğrencinin enerji seviyesini ve kalan gün sayısını dikkate alarak önümüzdeki 5 güne (0 ile 4 arası gün sapmalarıyla) en mantıklı şekilde dağıt.
    
    **KESİN KURALLAR (DİKKATLE UYULACAK):**
    1. Eğer enerji seviyesi düşükse (1 veya 2), daha kolay veya kısa süreli görevleri öne al, zor görevleri hafiflet veya sürelerini kısalt.
    2. Enerji seviyesi yüksekse zor konuları ve yoğun seansları yerleştir.
    3. BİLİŞSEL YÜK DENGESİ: Asla iki 'Zor' konuyu veya iki ağır sayısal dersi peş peşe planlama. Araya mutlaka sözel bir ders (Türkçe) veya hafif bir görev tampon olarak koy.
    4. ZAYIF DERS: Öğrencinin alanı ({focus_area}) için olan kritik görevlerin priority_score değerini her zaman daha yüksek (4.0 - 5.0) tut.
    5. Her görev için yeni bir priority_score (0.0 - 5.0 arası) belirle.
    6. Her görev için önümüzdeki 5 gün için bir gün sapması ("day_offset": 0 ile 4 arasında bir tamsayı) belirle. (0: Bugün, 1: Yarın vb.)
    
    Yanıtını sadece ve sadece belirtilen JSON formatında ver. Başka hiçbir açıklama, markdown işareti veya ek metin ekleme.
    JSON Formatı:
    [
      {{
        "id": <Görevin orijinal ID'si (integer)>,
        "title": "Görev Başlığı",
        "subject_name": "Ders Adı (MATEMATİK, FİZİK, vb.)",
        "estimated_time": <güncellenmiş tahmini süre (dakika)>,
        "priority_score": <Yeni hesaplanan öncelik puanı (float)>,
        "day_offset": <Önümüzdeki 5 gün için gün sapması (0 ile 4 arasında tamsayı)>
      }}
    ]
    """

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1
        }
    }

    response_text = call_gemini_api(payload)
    return parse_gemini_json(response_text, incomplete_tasks + other_tasks)

def solve_and_analyze_question(image_base64: str) -> Dict[str, Any]:
    """Hata kumbarasındaki sorunun resmini analiz eder, OCR metnini çıkarır, etiketler ve çözümü üretir"""
    mime_type, clean_data = clean_base64_image(image_base64)
    
    prompt = """
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
    """

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": clean_data
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1
        }
    }

    response_text = call_gemini_api(payload)
    fallback = {
        "ocr_text": "Metin okunamadı.",
        "subject_name": "MATEMATİK",
        "topic_name": "Bilinmeyen Konu",
        "difficulty": "Orta",
        "solution_text": "Sistem yoğunluğundan dolayı çözüm üretilemedi. Lütfen soruyu tekrar yüklemeyi deneyin."
    }
    return parse_gemini_json(response_text, fallback)
