import React, { useState, useEffect } from 'react';

// Varsayılan mock SVG soruları (yüksek kaliteli ve gerçekçi çizimler)
const MATH_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" fill="none">
  <rect width="300" height="200" fill="%23F8FAFC" rx="12"/>
  <path d="M50 150 L250 150 M50 30 L50 170" stroke="%2394A3B8" stroke-width="2" stroke-linecap="round"/>
  <path d="M50 150 Q 120 40 220 50" stroke="%233B82F6" stroke-width="3" fill="none"/>
  <text x="235" y="155" fill="%2364748B" font-family="sans-serif" font-size="12">x</text>
  <text x="40" y="35" fill="%2364748B" font-family="sans-serif" font-size="12">y</text>
  <text x="80" y="80" fill="%231E293B" font-family="sans-serif" font-size="14" font-weight="bold">y = f(x)</text>
  <text x="70" y="130" fill="%23EF4444" font-family="sans-serif" font-size="11">Limit x->a f(x) = ?</text>
  <line x1="120" y1="150" x2="120" y2="76" stroke="%23EF4444" stroke-dasharray="4" stroke-width="1.5"/>
  <circle cx="120" cy="76" r="4" fill="%23EF4444"/>
  <text x="115" y="165" fill="%23EF4444" font-family="sans-serif" font-size="11">a</text>
</svg>`;

const PHYSICS_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" fill="none">
  <rect width="300" height="200" fill="%23F8FAFC" rx="12"/>
  <path d="M50 150 L250 150 L250 70 Z" stroke="%2364748B" stroke-width="2" fill="%23E2E8F0"/>
  <rect x="110" y="90" width="40" height="30" transform="rotate(-21.8 110 90)" fill="%23EF4444" rx="4"/>
  <path d="M125 90 L125 40" stroke="%2310B981" stroke-width="2" stroke-linecap="round"/>
  <polygon points="125 35 121 43 129 43" fill="%2310B981"/>
  <text x="135" y="50" fill="%2310B981" font-family="sans-serif" font-size="12" font-weight="bold">N (Tepki Kuvveti)</text>
  <path d="M125 90 L125 140" stroke="%233B82F6" stroke-width="2" stroke-linecap="round"/>
  <polygon points="125 145 121 137 129 137" fill="%233B82F6"/>
  <text x="135" y="135" fill="%233B82F6" font-family="sans-serif" font-size="12" font-weight="bold">G = m.g</text>
  <text x="210" y="140" fill="%2364748B" font-family="sans-serif" font-size="14" font-weight="bold">alpha = 30°</text>
</svg>`;

const CHEMISTRY_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" fill="none">
  <rect width="300" height="200" fill="%23F8FAFC" rx="12"/>
  <path d="M150 50 L190 73 L190 119 L150 142 L110 119 L110 73 Z" stroke="%231E293B" stroke-width="3" fill="none"/>
  <path d="M150 60 L180 77 M180 115 L150 132 M120 115 L120 77" stroke="%231E293B" stroke-width="2.5"/>
  <text x="140" y="35" fill="%231E293B" font-family="sans-serif" font-size="14" font-weight="bold">Benzil Alkol</text>
  <path d="M190 73 L220 56" stroke="%231E293B" stroke-width="3"/>
  <text x="225" y="58" fill="%23EF4444" font-family="sans-serif" font-size="14" font-weight="bold">CH2-OH</text>
</svg>`;

const INITIAL_ERRORS = [
  {
    id: 1,
    subject: 'MATEMATİK',
    topic: 'Limit ve Süreklilik',
    difficulty: 'Zor',
    status: 'pending', // pending, solved
    image: MATH_SVG,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    date: '3 gün önce'
  },
  {
    id: 2,
    subject: 'FİZİK',
    topic: 'Eğik Düzlemde Sürtünme',
    difficulty: 'Orta',
    status: 'pending',
    image: PHYSICS_SVG,
    color: '#EF4444',
    bgColor: '#FEF2F2',
    date: 'Dün'
  },
  {
    id: 3,
    subject: 'KİMYA',
    topic: 'Organik Bileşikler',
    difficulty: 'Zor',
    status: 'solved',
    image: CHEMISTRY_SVG,
    color: '#10B981',
    bgColor: '#ECFDF5',
    date: '5 gün önce'
  }
];

export default function Errors({ onBack }) {
  const [errorsList, setErrorsList] = useState([]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterSubject, setFilterSubject] = useState('HEPSİ');
  const [selectedError, setSelectedError] = useState(null);
  const [solvedCount, setSolvedCount] = useState(() => {
    const saved = localStorage.getItem('solved_errors_count');
    return saved ? parseInt(saved, 10) : 1; // 1 adet mock çözülmüş soru varsayılan
  });

  // Form State
  const [subject, setSubject] = useState('MATEMATİK');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Orta');
  const [uploadedImage, setUploadedImage] = useState('');

  const subjectsConfig = {
    'MATEMATİK': { color: '#3B82F6', bgColor: '#EFF6FF' },
    'FİZİK': { color: '#EF4444', bgColor: '#FEF2F2' },
    'KİMYA': { color: '#10B981', bgColor: '#ECFDF5' },
    'BİYOLOJİ': { color: '#F97316', bgColor: '#FFF7ED' },
    'TÜRKÇE': { color: '#8B5CF6', bgColor: '#F5F3FF' }
  };

  // API'den hatalı soruları çek
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://127.0.0.1:8000/api/errors/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Hatalar yüklenemedi.');
    })
    .then(data => {
      const formatted = data.map(item => {
        const config = subjectsConfig[item.subject_name] || { color: '#64748B', bgColor: '#F1F5F9' };
        return {
          id: item.id,
          subject: item.subject_name,
          topic: item.topic_name,
          difficulty: item.difficulty,
          status: 'pending',
          image: item.image_data || item.image_url || MATH_SVG,
          color: config.color,
          bgColor: config.bgColor,
          date: new Date(item.created_at).toLocaleDateString('tr-TR')
        };
      });
      setErrorsList(formatted);
    })
    .catch(err => {
      console.error('API Error:', err);
    });
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddError = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Lütfen önce giriş yapın.');
      return;
    }

    const payload = {
      subject_name: subject,
      topic_name: topic,
      difficulty: difficulty,
      image_data: uploadedImage || MATH_SVG // base64 görsel verisi veya varsayılan
    };

    fetch('http://127.0.0.1:8000/api/errors/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Soru kaydedilemedi.');
    })
    .then(data => {
      const config = subjectsConfig[subject] || { color: '#64748B', bgColor: '#F1F5F9' };
      const newError = {
        id: data.id,
        subject: data.subject_name,
        topic: data.topic_name,
        difficulty: data.difficulty,
        status: 'pending',
        image: data.image_data || data.image_url || MATH_SVG,
        color: config.color,
        bgColor: config.bgColor,
        date: 'Bugün'
      };

      setErrorsList(prev => [newError, ...prev]);

      // Reset Form
      setTopic('');
      setDifficulty('Orta');
      setUploadedImage('');
      setShowAddForm(false);
    })
    .catch(err => {
      console.error(err);
      alert('Soru kaydedilirken bir hata oluştu.');
    });
  };

  const handleToggleSolved = (id) => {
    const solvedItem = errorsList.find(item => item.id === id);
    if (!solvedItem) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Çözülen soruyu listeden kaldırıyoruz (backend'den siliyoruz)
    fetch(`http://127.0.0.1:8000/api/errors/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.ok) {
        setErrorsList(prev => prev.filter(item => item.id !== id));
        
        // Detay modalı açıksa kapatıyoruz
        if (selectedError?.id === id) {
          setSelectedError(null);
        }

        // Öğrenilen toplam soru istatistiğini güncelliyoruz
        const newSolvedCount = solvedCount + 1;
        setSolvedCount(newSolvedCount);
        localStorage.setItem('solved_errors_count', newSolvedCount.toString());
      } else {
        throw new Error('Soru silinemedi.');
      }
    })
    .catch(err => {
      console.error(err);
      alert('Soru güncellenirken hata oluştu.');
    });
  };

  const handleDeleteError = (id) => {
    if (window.confirm('Bu soruyu kumbaradan kalıcı olarak silmek istiyor musunuz?')) {
      const token = localStorage.getItem('token');
      if (!token) return;

      fetch(`http://127.0.0.1:8000/api/errors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) {
          setErrorsList(prev => prev.filter(item => item.id !== id));
        } else {
          throw new Error('Soru silinemedi.');
        }
      })
      .catch(err => {
        console.error(err);
        alert('Soru silinirken hata oluştu.');
      });
    }
  };

  // Filtrelenmiş liste
  const filteredList = errorsList.filter(item => {
    return filterSubject === 'HEPSİ' || item.subject === filterSubject;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton} title="Geri Dön">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h2 style={styles.headerTitle}>Hata Kumbarası 🏺</h2>
        <button 
          style={styles.addButton}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Kapat' : 'Fotoğraf Ekle'}
        </button>
      </div>

      <div style={styles.content}>
        {/* Hata Ekleme Formu */}
        {showAddForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Yanlış Soru Ekle</h3>
            <form onSubmit={handleAddError} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ders</label>
                <div style={styles.subjectTabs}>
                  {Object.keys(subjectsConfig).map(subj => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSubject(subj)}
                      style={{
                        ...styles.subjectTabBtn,
                        borderColor: subject === subj ? subjectsConfig[subj].color : '#E2E8F0',
                        backgroundColor: subject === subj ? subjectsConfig[subj].bgColor : '#FFFFFF',
                        color: subject === subj ? subjectsConfig[subj].color : '#64748B',
                      }}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Konu Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: Paragraf Yapısı, Basit Harmonik Hareket"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Zorluk Seviyesi</label>
                <div style={styles.diffRow}>
                  {['Kolay', 'Orta', 'Zor'].map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      style={{
                        ...styles.diffBtn,
                        backgroundColor: difficulty === diff ? '#E0F2FE' : '#FFFFFF',
                        borderColor: difficulty === diff ? '#0284C7' : '#E2E8F0',
                        color: difficulty === diff ? '#0369A1' : '#64748B'
                      }}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Sorunun Fotoğrafı</label>
                <div style={styles.uploadArea}>
                  {uploadedImage ? (
                    <div style={styles.previewContainer}>
                      <img src={uploadedImage} alt="Hata Önizleme" style={styles.previewImage} />
                      <button 
                        type="button" 
                        onClick={() => setUploadedImage('')} 
                        style={styles.removePreviewBtn}
                      >
                        Değiştir
                      </button>
                    </div>
                  ) : (
                    <label style={styles.uploadLabel}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Soru Fotoğrafı Çek / Seç</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <button type="submit" style={styles.submitBtn}>
                Kumbaraya At 💾
              </button>
            </form>
          </div>
        )}

        {/* Kumbaram Bilgisi */}
        <div style={styles.kumbaraInfo}>
          <div style={styles.kumbaraStats}>
            <span style={styles.statNumber}>{errorsList.length}</span>
            <span style={styles.statText}>Çözülecek Hata</span>
          </div>
          <div style={styles.kumbaraStats}>
            <span style={{ ...styles.statNumber, color: '#10B981' }}>{solvedCount}</span>
            <span style={styles.statText}>Öğrenilen Hata</span>
          </div>
        </div>

        {/* Filtreleme Barları */}
        <div style={styles.filterSection}>
          <div style={styles.subjectFilterBar}>
            {['HEPSİ', 'MATEMATİK', 'FİZİK', 'KİMYA', 'BİYOLOJİ', 'TÜRKÇE'].map(subj => (
              <button
                key={subj}
                onClick={() => setFilterSubject(subj)}
                style={{
                  ...styles.filterChip,
                  backgroundColor: filterSubject === subj ? '#1E293B' : '#FFFFFF',
                  color: filterSubject === subj ? '#FFFFFF' : '#64748B',
                }}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Hata Kartları Listesi */}
        {filteredList.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: '48px' }}>🎉</span>
            <h4 style={{ color: '#243B55', fontWeight: '700', margin: '12px 0 4px' }}>Temiz Kumbara!</h4>
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>Burada görüntülenecek hiç yanlış soru yok.</p>
          </div>
        ) : (
          <div style={styles.errorsGrid}>
            {filteredList.map((item) => (
              <div 
                key={item.id} 
                style={{
                  ...styles.errorCard,
                  borderColor: selectedError?.id === item.id ? item.color : (item.status === 'solved' ? '#10B981' : '#E2E8F0')
                }}
                onClick={() => setSelectedError(item)}
              >
                {/* Soru Görseli Thumbnail */}
                <img src={item.image} alt={item.topic} style={styles.cardThumbnail} />
                
                {/* Ders Belirteç Noktası */}
                <div style={{ ...styles.subjectDot, backgroundColor: item.color }} title={item.subject} />

                {/* Öğrendim Seçim Yuvarlağı */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSolved(item.id);
                  }}
                  style={{
                    ...styles.solvedToggleButton,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    borderColor: '#94A3B8',
                    color: 'transparent',
                  }}
                  title="Öğrendim Olarak İşaretle"
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Görsel Büyüteç ve Detay Modalı */}
      {selectedError && (
        <div style={styles.modalOverlay} onClick={() => setSelectedError(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalCloseBtn} onClick={() => setSelectedError(null)}>✕</button>
            
            {/* Modal Image */}
            <div style={styles.modalImageContainer}>
              <img src={selectedError.image} alt={selectedError.topic} style={styles.modalImage} />
            </div>

            {/* Modal Details */}
            <div style={styles.modalDetails}>
              <div style={styles.modalHeaderRow}>
                <span style={{ ...styles.cardBadge, backgroundColor: selectedError.bgColor, color: selectedError.color }}>
                  {selectedError.subject}
                </span>
                <span style={styles.modalDate}>{selectedError.date}</span>
              </div>
              
              <h3 style={styles.modalTopic}>{selectedError.topic}</h3>
              
              <div style={styles.modalFooterRow}>
                <span style={{
                  ...styles.diffLabel,
                  color: selectedError.difficulty === 'Zor' ? '#EF4444' : selectedError.difficulty === 'Orta' ? '#F59E0B' : '#10B981'
                }}>
                  Zorluk: {selectedError.difficulty}
                </span>

                <div style={styles.modalActions}>
                  <button 
                    onClick={() => {
                      handleToggleSolved(selectedError.id);
                    }} 
                    style={{
                      ...styles.modalActionBtn,
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                    }}
                  >
                    ✓ Çözümü Öğrendim
                  </button>
                  <button 
                    onClick={() => {
                      const id = selectedError.id;
                      setSelectedError(null);
                      handleDeleteError(id);
                    }}
                    style={{ ...styles.modalActionBtn, backgroundColor: '#FEF2F2', color: '#EF4444' }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '440px',
    margin: '0 auto',
    paddingBottom: '100px',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    padding: '20px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
  },
  backButton: {
    background: 'none',
    border: 'none',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#1E293B',
    margin: 0,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  content: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  kumbaraInfo: {
    display: 'flex',
    gap: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
  },
  kumbaraStats: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#3B82F6',
  },
  statText: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  formCard: {
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid #BAE6FD',
    backgroundColor: '#F0F9FF',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    animation: 'pulse 2s infinite',
  },
  formTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0369A1',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0369A1',
  },
  input: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#1E293B',
    outline: 'none',
  },
  subjectTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  subjectTabBtn: {
    borderRadius: '10px',
    border: '1px solid',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  diffRow: {
    display: 'flex',
    gap: '12px',
  },
  diffBtn: {
    flex: 1,
    border: '1px solid',
    padding: '8px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  uploadArea: {
    border: '2px dashed #94A3B8',
    borderRadius: '16px',
    backgroundColor: '#FFFFFF',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    width: '100%',
  },
  previewContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
  },
  previewImage: {
    width: '100%',
    maxHeight: '150px',
    objectFit: 'contain',
    borderRadius: '12px',
  },
  removePreviewBtn: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '16px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '800',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
  },
  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  subjectFilterBar: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  filterChip: {
    border: 'none',
    borderRadius: '12px',
    padding: '8px 14px',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
  },
  statusFilterBar: {
    display: 'flex',
    borderBottom: '1px solid #E2E8F0',
  },
  statusBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '12px 4px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
  },
  errorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  errorCard: {
    position: 'relative',
    aspectRatio: '1 / 1',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '2px solid #E2E8F0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  cardThumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  subjectDot: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: '1px solid #FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  solvedToggleButton: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
    transition: 'all 0.15s ease',
    padding: 0,
    outline: 'none',
    zIndex: 5,
  },
  solvedCardPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 8px',
    textAlign: 'center',
    gap: '2px',
  },
  placeholderTick: {
    fontSize: '24px',
    fontWeight: '900',
    lineHeight: 1,
  },
  placeholderTopicText: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#334155',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.2',
  },
  modalPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    minHeight: '200px',
    width: '100%',
  },
  cardBadge: {
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: '800',
  },
  diffLabel: {
    fontSize: '12px',
    fontWeight: '700',
  },
  modalImageContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #E2E8F0',
  },
  modalDetails: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  modalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTopic: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#1E293B',
    margin: 0,
  },
  modalDate: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalFooterRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '4px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  modalActionBtn: {
    flex: 1,
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  emptyState: {
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    border: '1px dashed #CBD5E1',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    position: 'relative',
    maxWidth: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: '-40px',
    right: '0px',
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '24px',
    cursor: 'pointer',
  },
  modalImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: '12px',
  }
};
