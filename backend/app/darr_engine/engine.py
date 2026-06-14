import datetime
from typing import List, Dict, Any

# YKS Dersleri ve Konularının Zorluk ve Çıkma Ağırlığı Katsayıları
CURRICULUM_DATA = {
    "MATEMATİK": {
        "Temel Kavramlar & Sayılar": {"weight": 1.2, "difficulty": "Kolay", "estimated_hours": 10},
        "Üslü ve Köklü İfadeler": {"weight": 1.1, "difficulty": "Kolay", "estimated_hours": 8},
        "Denklem ve Eşitsizlikler": {"weight": 1.2, "difficulty": "Orta", "estimated_hours": 12},
        "Fonksiyonlar": {"weight": 1.5, "difficulty": "Orta", "estimated_hours": 15},
        "Polinomlar & Dereceler": {"weight": 1.3, "difficulty": "Orta", "estimated_hours": 8},
        "Trigonometri": {"weight": 1.8, "difficulty": "Zor", "estimated_hours": 20},
        "Limit ve Süreklilik": {"weight": 1.6, "difficulty": "Zor", "estimated_hours": 12},
        "Türev": {"weight": 2.0, "difficulty": "Zor", "estimated_hours": 25},
        "İntegral": {"weight": 2.2, "difficulty": "Zor", "estimated_hours": 30},
    },
    "FİZİK": {
        "Fizik Bilimine Giriş & Madde": {"weight": 1.0, "difficulty": "Kolay", "estimated_hours": 6},
        "Vektörler & Bağıl Hareket": {"weight": 1.2, "difficulty": "Orta", "estimated_hours": 8},
        "Newton'ın Hareket Yasaları": {"weight": 1.5, "difficulty": "Orta", "estimated_hours": 10},
        "İş, Güç ve Enerji": {"weight": 1.3, "difficulty": "Orta", "estimated_hours": 8},
        "Elektrik ve Manyetizma": {"weight": 1.8, "difficulty": "Zor", "estimated_hours": 18},
        "Optik & Dalgalar": {"weight": 1.6, "difficulty": "Zor", "estimated_hours": 15},
        "Modern Fizik ve Teknolojideki Uygulamaları": {"weight": 1.4, "difficulty": "Orta", "estimated_hours": 12},
    },
    "KİMYA": {
        "Kimya Bilimi & Atomun Yapısı": {"weight": 1.1, "difficulty": "Kolay", "estimated_hours": 6},
        "Periyodik Sistem & Kimyasal Türler": {"weight": 1.2, "difficulty": "Kolay", "estimated_hours": 8},
        "Maddenin Halleri & Karışımlar": {"weight": 1.3, "difficulty": "Orta", "estimated_hours": 10},
        "Asitler, Bazlar ve Tuzlar": {"weight": 1.2, "difficulty": "Orta", "estimated_hours": 8},
        "Kimyasal Tepkimelerde Enerji ve Hız": {"weight": 1.5, "difficulty": "Zor", "estimated_hours": 12},
        "Organik Kimyaya Giriş": {"weight": 1.7, "difficulty": "Zor", "estimated_hours": 16},
    },
    "BİYOLOJİ": {
        "Canlıların Ortak Özellikleri & Hücre": {"weight": 1.0, "difficulty": "Kolay", "estimated_hours": 8},
        "Canlılar Dünyası & Kalıtım": {"weight": 1.3, "difficulty": "Orta", "estimated_hours": 12},
        "İnsan Fizyolojisi & Sistemler": {"weight": 1.8, "difficulty": "Zor", "estimated_hours": 24},
        "Hücresel Solunum & Fotosentez": {"weight": 1.6, "difficulty": "Zor", "estimated_hours": 14},
        "Ekoloji & Çevre Bilimi": {"weight": 1.1, "difficulty": "Kolay", "estimated_hours": 6},
    },
    "TÜRKÇE": {
        "Sözcükte ve Cümlede Anlam": {"weight": 1.2, "difficulty": "Kolay", "estimated_hours": 8},
        "Paragrafta Anlam ve Yapı": {"weight": 1.6, "difficulty": "Orta", "estimated_hours": 20},
        "Ses Bilgisi & Noktalama İşaretleri": {"weight": 1.1, "difficulty": "Kolay", "estimated_hours": 6},
        "Yazım Rules": {"weight": 1.2, "difficulty": "Kolay", "estimated_hours": 6},
        "Sözcük Türleri & Dil Bilgisi": {"weight": 1.4, "difficulty": "Orta", "estimated_hours": 14},
    }
}

PREREQUISITES = {
    "MATEMATİK": {
        "Türev": ["Fonksiyonlar"],
        "İntegral": ["Türev", "Fonksiyonlar"]
    },
    "FİZİK": {
        "Basit Harmonik Hareket": ["Newton"]
    },
    "KİMYA": {
        "Organik Kimya": ["Kimya Bilimi"]
    },
    "BİYOLOJİ": {
        "İnsan Fizyolojisi & Sistemler": ["Canlıların Ortak Özellikleri"]
    }
}

def calculate_remaining_days(exam_date_str: str) -> int:
    """Sınav tarihine kalan gün sayısını hesaplar"""
    if not exam_date_str:
        return 90 # Varsayılan gün sayısı
    try:
        exam_date = datetime.datetime.strptime(exam_date_str, "%Y-%m-%d").date()
        today = datetime.date.today()
        delta = exam_date - today
        return max(1, delta.days)
    except ValueError:
        return 90

def get_weekly_hours_limit(weekly_hours_str: str) -> float:
    """Haftalık müsaitlik metninden sayısal saat sınırını çıkarır"""
    if not weekly_hours_str:
        return 15.0
    if "10-20" in weekly_hours_str:
        return 15.0
    elif "20-30" in weekly_hours_str:
        return 25.0
    elif "30+" in weekly_hours_str or "30" in weekly_hours_str:
        return 35.0
    return 15.0

def run_darr_algorithm(
    remaining_days: int,
    weekly_hours_limit: float,
    daily_goal_hours: float,
    current_energy_level: int, # 1 ile 5 arası
    tasks_to_schedule: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    DARR (Dynamic Adaptive Road Re-routing) optimizasyon algoritması.
    Görevleri öncelik puanlarına göre sıralar ve günlük bilişsel yükü
    dengeleyerek (Aynı güne birden fazla 'Zor' konu gelmeyecek şekilde) 7 günlük programa dağıtır.
    """
    # Enerji Seviyesi Verimlilik Faktörü
    # Enerji seviyesi düşükse (örn: 1 veya 2), verimlilik düşecektir.
    energy_factor = 0.6 + (current_energy_level * 0.1) # 1->0.7, 3->0.9, 5->1.1
    
    # Her görev için öncelik puanını ve metadata bilgisini hesapla
    processed_tasks = []
    for task in tasks_to_schedule:
        subject = task.get("subject_name", "MATEMATİK")
        title = task.get("title") or ""
        
        # Konu bilgilerini al (kısmi eşleşme ile)
        subject_info = CURRICULUM_DATA.get(subject, {})
        topic_info = None
        for key, val in subject_info.items():
            if key in title or title in key:
                topic_info = val
                break
        if not topic_info:
            topic_info = {"weight": 1.0, "difficulty": "Orta", "estimated_hours": 10}
        
        weight = topic_info["weight"]
        difficulty = topic_info["difficulty"]
        
        # Öncelik Puanı Formülü: (Ağırlık * Enerji Faktörü * 100) / (Kalan Gün * Hedef Saat)
        denominator = max(1, remaining_days * daily_goal_hours * energy_factor)
        priority_score = (weight * 100.0) / denominator
        
        processed_tasks.append({
            "id": task.get("id"),
            "title": title,
            "subject_name": subject,
            "status": "pending",
            "priority_score": round(priority_score, 2),
            "difficulty": difficulty,
            "estimated_time": topic_info["estimated_hours"] * 60, # saatten dakikaya
            "actual_time": 0
        })

    # Bağımlılık Zinciri (Prerequisite Tree) Analizi ve Sıralama Önceliklendirmesi
    # Eğer bir konu (dep) ön koşula (req) bağımlıysa, ön koşulun öncelik puanı bağımlı konudan yüksek olmalıdır.
    for _ in range(3): # Zincirleme bağımlılıkları çözmek için 3 geçiş
        for task in processed_tasks:
            subj = task["subject_name"]
            title = task["title"]
            
            # Bu konunun bağımlı olduğu ön koşul listesini bul
            subj_prereqs = PREREQUISITES.get(subj, {})
            prereq_keys = []
            for dep, reqs in subj_prereqs.items():
                if dep in title or title in dep:
                    prereq_keys = reqs
                    break
            
            # Eğer ön koşul varsa, kuyruktaki diğer tüm ön koşul görevlerinin puanlarını yükselt
            if prereq_keys:
                for req in prereq_keys:
                    for other in processed_tasks:
                        if other["subject_name"] == subj and (req in other["title"] or other["title"] in req):
                            # Ön koşul görevinin önceliği, bağımlı görevin önceliğinden en az +0.1 fazla olmalı
                            if other["priority_score"] <= task["priority_score"]:
                                other["priority_score"] = task["priority_score"] + 0.1

    # Görevleri öncelik puanına göre azalan sırada sırala (artık bağımlılıklar sıralamada korunur!)
    processed_tasks.sort(key=lambda x: x["priority_score"], reverse=True)

    # 7 Günlük program sepetleri (Bilişsel Yük kuralı için)
    # Her gün için en fazla daily_goal_hours * 60 dakika planlanabilir.
    # Tembellik Kilidi (Anti-Abuse): Enerji ne kadar düşük girilirse girilsin, günlük çalışma süresi 120 dakikanın altına düşemez.
    daily_limit_minutes = max(120.0, daily_goal_hours * 60 * energy_factor)
    schedule = {day: [] for day in range(1, 6)}
    
    for task in processed_tasks:
        assigned = False
        # Görevi yerleştirmek için en uygun günü bul
        for day in range(1, 6):
            day_tasks = schedule[day]
            day_total_time = sum(t["estimated_time"] for t in day_tasks)
            
            # Kural 1: Günlük süre sınırını aşmamalı
            if day_total_time + task["estimated_time"] > daily_limit_minutes:
                # Eğer tüm günler doluysa kuralı gevşetip süre sınırını zorlamalıyız, ama şimdilik pas geçelim
                continue
                
            # Kural 2: Bilişsel Yük Dengesi - Aynı güne 2 'Zor' konu gelemez
            if task["difficulty"] == "Zor":
                has_hard_task = any(t["difficulty"] == "Zor" for t in day_tasks)
                if has_hard_task:
                    continue # Diğer günü dene
            
            # Kurallara uyuyorsa yerleştir
            schedule[day].append(task)
            task["day_assigned"] = day
            assigned = True
            break
            
        # Eğer katı kurallardan dolayı hiçbir güne atanamadıysa, en az yükü olan güne yerleştir (Fallback)
        if not assigned:
            least_loaded_day = min(range(1, 6), key=lambda d: sum(t["estimated_time"] for t in schedule[d]))
            schedule[least_loaded_day].append(task)
            task["day_assigned"] = least_loaded_day

    # Dağıtılmış programı düzleştirilmiş liste olarak döndür
    final_scheduled_tasks = []
    for day in range(1, 6):
        for task in schedule[day]:
            final_scheduled_tasks.append(task)
            
    return final_scheduled_tasks
