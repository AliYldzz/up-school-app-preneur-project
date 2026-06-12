from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.task_template import TaskTemplate
from app.core.database import Base

# Tabloların oluştuğundan emin olalım
Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    
    # Eski verileri temizle ki güncel kolonlarla yeniden eklensin
    db.query(TaskTemplate).delete()
    db.commit()

    print("MEB Müfredatına Göre Çekirdek Görevler Yükleniyor (Alan Filtreleriyle)...")
    
    ALL = "Sayısal,Eşit Ağırlık,Sözel,Dil"
    SAY_EA = "Sayısal,Eşit Ağırlık"
    SAY_EA_SOZ = "Sayısal,Eşit Ağırlık,Sözel"
    SAY = "Sayısal"
    EA_SOZ = "Eşit Ağırlık,Sözel"
    
    seed_data = [
        # MATEMATİK (TYT)
        {"subject_name": "MATEMATİK", "topic": "Temel Kavramlar ve Sayı Kümeleri", "level": "Kolay", "estimated_time": 40, "exam_type": "TYT", "allowed_fields": ALL, "description": "Sayı kümeleri ve işlem önceliği üzerine genel tekrar ve test çözümü."},
        {"subject_name": "MATEMATİK", "topic": "Üslü ve Köklü Sayılar", "level": "Orta", "estimated_time": 45, "exam_type": "TYT", "allowed_fields": ALL, "description": "ÖSYM tarzı yeni nesil üslü ve köklü sayı soruları pratiği."},
        {"subject_name": "MATEMATİK", "topic": "Mutlak Değer Kavramı ve Eşitsizlikler", "level": "Orta", "estimated_time": 50, "exam_type": "TYT", "allowed_fields": ALL, "description": "Mutlak değer sınırları ve grafiksel yorumlama çalışması."},
        {"subject_name": "MATEMATİK", "topic": "Çarpanlara Ayırma", "level": "Zor", "estimated_time": 60, "exam_type": "TYT", "allowed_fields": ALL, "description": "Karmaşık ifadelerin sadeleştirilmesi ve özdeşlikler üzerine soru çözümü."},
        {"subject_name": "MATEMATİK", "topic": "Oran-Orantı ve Problemlere Giriş", "level": "Orta", "estimated_time": 45, "exam_type": "TYT", "allowed_fields": ALL, "description": "Günlük hayat senaryolu problemler için temel oran mantığı testi."},
        {"subject_name": "MATEMATİK", "topic": "Hız ve Hareket Problemleri", "level": "Zor", "estimated_time": 60, "exam_type": "TYT", "allowed_fields": ALL, "description": "Birbirine doğru ve zıt yönde hareket konulu deneme soruları."},
        
        # MATEMATİK (AYT)
        {"subject_name": "MATEMATİK", "topic": "Fonksiyonlar - Grafik Okuma", "level": "Zor", "estimated_time": 50, "exam_type": "AYT", "allowed_fields": SAY_EA_SOZ, "description": "Bileşke fonksiyonlar ve grafik üzerinden f(x) değer bulma."},
        {"subject_name": "MATEMATİK", "topic": "Trigonometri Başlangıç", "level": "Orta", "estimated_time": 45, "exam_type": "AYT", "allowed_fields": SAY_EA, "description": "Dik üçgende trigonometrik oranlar ve temel formüller tekrarı."},
        {"subject_name": "MATEMATİK", "topic": "Türev Alma Kuralları", "level": "Zor", "estimated_time": 60, "exam_type": "AYT", "allowed_fields": SAY_EA, "description": "Bölümün, çarpımın türevi ve zincir kuralı karma testi."},
        {"subject_name": "MATEMATİK", "topic": "İntegralde Alan Hesaplama", "level": "Zor", "estimated_time": 60, "exam_type": "AYT", "allowed_fields": SAY_EA, "description": "Eğri altında kalan alan hesaplamaları ve Riemann toplamı pratiği."},

        # TÜRKÇE (TYT)
        {"subject_name": "TÜRKÇE", "topic": "Sözcükte Anlam ve Cümlede Anlam", "level": "Kolay", "estimated_time": 30, "exam_type": "TYT", "allowed_fields": ALL, "description": "Altı çizili sözcüğün anlamı ve cümleden çıkarılabilecek kesin yargı testi."},
        {"subject_name": "TÜRKÇE", "topic": "Paragrafta Ana Düşünce", "level": "Orta", "estimated_time": 40, "exam_type": "TYT", "allowed_fields": ALL, "description": "30 soruluk odaklanmış paragraf ana düşünce ve yardımcı düşünce denemesi."},
        {"subject_name": "TÜRKÇE", "topic": "Paragrafın Yapısı (Akışı Bozan Cümle)", "level": "Zor", "estimated_time": 45, "exam_type": "TYT", "allowed_fields": ALL, "description": "Paragraf bölme ve düşüncenin akışını bozan cümleyi bulma tekniği."},
        {"subject_name": "TÜRKÇE", "topic": "Ses Bilgisi (Ünlü Düşmesi, Ünsüz Benzeşmesi)", "level": "Kolay", "estimated_time": 30, "exam_type": "TYT", "allowed_fields": ALL, "description": "Kısa konu anlatımı okuması ve 20 soruluk pekiştirme testi."},
        {"subject_name": "TÜRKÇE", "topic": "Sözcük Türleri (İsim, Sıfat, Zamir, Zarf)", "level": "Orta", "estimated_time": 45, "exam_type": "TYT", "allowed_fields": ALL, "description": "Karma dil bilgisi soruları ile sözcük türlerinin cümle içi analizi."},
        {"subject_name": "TÜRKÇE", "topic": "Cümlenin Ögeleri", "level": "Orta", "estimated_time": 40, "exam_type": "TYT", "allowed_fields": ALL, "description": "Özneyi, nesneyi ve yüklemi doğru bulma pratikleri."},
        {"subject_name": "TÜRKÇE", "topic": "Yazım Kuralları ve Noktalama İşaretleri", "level": "Orta", "estimated_time": 35, "exam_type": "TYT", "allowed_fields": ALL, "description": "Virgülün kullanımı ve bitişik/ayrı yazılan kelimeler üzerine quiz."},

        # FİZİK (TYT)
        {"subject_name": "FİZİK", "topic": "Fizik Bilimine Giriş ve Madde Özellikleri", "level": "Kolay", "estimated_time": 30, "exam_type": "TYT", "allowed_fields": ALL, "description": "Özkütle, dayanıklılık, kılcallık ve yüzey gerilimi okuma & test."},
        {"subject_name": "FİZİK", "topic": "İş, Güç ve Enerji", "level": "Orta", "estimated_time": 50, "exam_type": "TYT", "allowed_fields": ALL, "description": "Kinetik ve potansiyel enerji dönüşümleri ile mekanik enerji korunumu."},
        {"subject_name": "FİZİK", "topic": "Isı, Sıcaklık ve Genleşme", "level": "Orta", "estimated_time": 45, "exam_type": "TYT", "allowed_fields": ALL, "description": "Hal değişimi grafikleri ve ısıl denge problemleri."},
        {"subject_name": "FİZİK", "topic": "Elektrostatik ve Elektrik Akımı", "level": "Zor", "estimated_time": 60, "exam_type": "TYT", "allowed_fields": ALL, "description": "Eşdeğer direnç hesaplama, Ohm yasası ve elektrik devresi yorumlama."},
        {"subject_name": "FİZİK", "topic": "Optik (Yansıma, Düzlem Ayna, Kırılma)", "level": "Zor", "estimated_time": 60, "exam_type": "TYT", "allowed_fields": ALL, "description": "Görüş alanı hesaplama ve ışığın kırılma indisine göre davranışı."},

        # FİZİK (AYT)
        {"subject_name": "FİZİK", "topic": "Kuvvet ve Hareket (Newton'un Yasaları)", "level": "Zor", "estimated_time": 60, "exam_type": "AYT", "allowed_fields": SAY, "description": "Sürtünmeli eğik düzlem ve eylemsizlik prensibi işlem pratiği."},
        {"subject_name": "FİZİK", "topic": "Basit Harmonik Hareket", "level": "Orta", "estimated_time": 45, "exam_type": "AYT", "allowed_fields": SAY, "description": "Yay sarkacı ve basit sarkaçta periyot bulma soruları."},
        {"subject_name": "FİZİK", "topic": "Modern Fizik (Fotoelektrik Olay)", "level": "Zor", "estimated_time": 50, "exam_type": "AYT", "allowed_fields": SAY, "description": "Eşik enerjisi, foton kinetik enerjisi ve de Broglie dalga boyu."}
    ]

    for data in seed_data:
        template = TaskTemplate(**data)
        db.add(template)

    db.commit()
    print(f"Toplam {len(seed_data)} görev şablonu (Alan Filtreleriyle) başarıyla eklendi!")
    db.close()

if __name__ == "__main__":
    seed_db()
