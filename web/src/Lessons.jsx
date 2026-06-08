import React, { useState, useEffect } from 'react';

const CURRICULUM = {
  'MATEMATİK': {
    icon: '📐',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    topics: [
      'Temel Kavramlar & Sayılar',
      'Üslü ve Köklü İfadeler',
      'Denklem ve Eşitsizlikler',
      'Fonksiyonlar',
      'Polinomlar & Dereceler',
      'Trigonometri',
      'Limit ve Süreklilik',
      'Türev',
      'İntegral'
    ]
  },
  'FİZİK': {
    icon: '⚡',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    topics: [
      'Fizik Bilimine Giriş & Madde',
      'Vektörler & Bağıl Hareket',
      'Newton\'ın Hareket Yasaları',
      'İş, Güç ve Enerji',
      'Elektrik ve Manyetizma',
      'Optik & Dalgalar',
      'Modern Fizik ve Teknolojideki Uygulamaları'
    ]
  },
  'KİMYA': {
    icon: '🧪',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    topics: [
      'Kimya Bilimi & Atomun Yapısı',
      'Periyodik Sistem & Kimyasal Türler',
      'Maddenin Halleri & Karışımlar',
      'Asitler, Bazlar ve Tuzlar',
      'Kimyasal Tepkimelerde Enerji ve Hız',
      'Organik Kimyaya Giriş'
    ]
  },
  'BİYOLOJİ': {
    icon: '🧬',
    color: '#F97316',
    bgColor: '#FFF7ED',
    borderColor: '#FFEDD5',
    topics: [
      'Canlıların Ortak Özellikleri & Hücre',
      'Canlılar Dünyası & Kalıtım',
      'İnsan Fizyolojisi & Sistemler',
      'Hücresel Solunum & Fotosentez',
      'Ekoloji & Çevre Bilimi'
    ]
  },
  'TÜRKÇE': {
    icon: '📝',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    topics: [
      'Sözcükte ve Cümlede Anlam',
      'Paragrafta Anlam ve Yapı',
      'Ses Bilgisi & Noktalama İşaretleri',
      'Yazım Kuralları',
      'Sözcük Türleri & Dil Bilgisi'
    ]
  }
};

export default function Lessons({ onBack }) {
  const [completedTopics, setCompletedTopics] = useState(() => {
    const saved = localStorage.getItem('curriculum_progress');
    return saved ? JSON.parse(saved) : {};
  });

  const userFocus = localStorage.getItem('userFocus') || 'Sayısal';
  const defaultExpanded = userFocus === 'Sözel' ? 'TÜRKÇE' : 'MATEMATİK';

  const [expandedSubjects, setExpandedSubjects] = useState({
    [defaultExpanded]: true,
  });

  const [searchText, setSearchText] = useState('');

  // Handle Search filtering
  useEffect(() => {
    if (searchText.trim() !== '') {
      // Auto-expand all subjects when searching
      const allExpanded = {};
      Object.keys(CURRICULUM).forEach(subj => {
        allExpanded[subj] = true;
      });
      setExpandedSubjects(allExpanded);
    }
  }, [searchText]);

  const toggleSubject = (subject) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subject]: !prev[subject]
    }));
  };

  const toggleTopic = (subject, topic) => {
    const key = `${subject}-${topic}`;
    const newProgress = {
      ...completedTopics,
      [key]: !completedTopics[key]
    };
    setCompletedTopics(newProgress);
    localStorage.setItem('curriculum_progress', JSON.stringify(newProgress));
  };

  // Helper stats calculation
  const getSubjectStats = (subjectName) => {
    const topics = CURRICULUM[subjectName].topics;
    const completedCount = topics.filter(t => completedTopics[`${subjectName}-${t}`]).length;
    const totalCount = topics.length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return { completedCount, totalCount, percent };
  };

  // Filter topics based on search text
  const getFilteredTopics = (subjectName) => {
    const topics = CURRICULUM[subjectName].topics;
    if (!searchText.trim()) return topics;
    return topics.filter(t => t.toLowerCase().includes(searchText.toLowerCase()));
  };

  const getOrderedSubjects = (focus) => {
    if (focus === 'Eşit Ağırlık') {
      return ['MATEMATİK', 'TÜRKÇE', 'BİYOLOJİ', 'FİZİK', 'KİMYA'];
    } else if (focus === 'Sözel') {
      return ['TÜRKÇE', 'BİYOLOJİ', 'MATEMATİK', 'FİZİK', 'KİMYA'];
    }
    return ['MATEMATİK', 'FİZİK', 'KİMYA', 'BİYOLOJİ', 'TÜRKÇE'];
  };

  // Filter subjects that have matching topics (or display all if search is empty)
  const orderedSubjectsList = getOrderedSubjects(userFocus);
  const filteredSubjects = orderedSubjectsList.filter(subj => {
    if (!searchText.trim()) return true;
    return getFilteredTopics(subj).length > 0;
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
        <h2 style={styles.headerTitle}>Ders Müfredat Takibi 📊</h2>
        <div style={{ width: '32px' }} /> {/* Spacing helper */}
      </div>

      <div style={styles.content}>
        {/* Arama Barı */}
        <div style={styles.searchContainer}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={styles.searchIcon}>
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Konu başlığı ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={styles.searchInput}
          />
          {searchText && (
            <button style={styles.clearSearchBtn} onClick={() => setSearchText('')}>✕</button>
          )}
        </div>

        {/* Dersler Akordeon Listesi */}
        {filteredSubjects.length === 0 ? (
          <div style={styles.emptySearchState}>
            <span>🔍</span>
            <p style={{ margin: '8px 0 0', fontWeight: '600', color: '#64748B' }}>
              Aramanızla eşleşen bir konu bulunamadı.
            </p>
          </div>
        ) : (
          <div style={styles.subjectsList}>
            {filteredSubjects.map((subjName) => {
              const subj = CURRICULUM[subjName];
              const isExpanded = expandedSubjects[subjName];
              const { completedCount, totalCount, percent } = getSubjectStats(subjName);
              const visibleTopics = getFilteredTopics(subjName);

              return (
                <div key={subjName} style={{ ...styles.subjectCard, borderColor: subj.borderColor }}>
                  {/* Akordeon Başlığı */}
                  <div 
                    onClick={() => toggleSubject(subjName)} 
                    style={{ ...styles.subjectHeader, backgroundColor: subj.bgColor }}
                  >
                    <div style={styles.headerLeft}>
                      <span style={styles.subjectIcon}>{subj.icon}</span>
                      <div style={styles.subjectMeta}>
                        <h3 style={{ ...styles.subjectName, color: subj.color }}>{subjName}</h3>
                        <span style={styles.progressText}>
                          {completedCount} / {totalCount} Konu • %{percent}
                        </span>
                      </div>
                    </div>

                    <div style={styles.headerRight}>
                      {/* Küçük İlerleme Barı */}
                      <div style={styles.smallProgressTrack}>
                        <div style={{ ...styles.smallProgressFill, backgroundColor: subj.color, width: `${percent}%` }} />
                      </div>
                      
                      {/* Aç/Kapat İkonu */}
                      <svg 
                        width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>

                  {/* Akordeon İçeriği (Konu Listesi) */}
                  {isExpanded && (
                    <div style={styles.topicsContainer}>
                      {visibleTopics.map((topic) => {
                        const isCompleted = completedTopics[`${subjName}-${topic}`];
                        return (
                          <div 
                            key={topic} 
                            onClick={() => toggleTopic(subjName, topic)}
                            style={{
                              ...styles.topicRow,
                              backgroundColor: isCompleted ? '#F0FDF4' : '#FFFFFF',
                            }}
                          >
                            <span style={{
                              ...styles.topicText,
                              color: isCompleted ? '#0F172A' : '#475569',
                              textDecoration: isCompleted ? 'line-through' : 'none'
                            }}>
                              {topic}
                            </span>
                            
                            {/* Checkbox */}
                            <div style={{
                              ...styles.checkbox,
                              backgroundColor: isCompleted ? '#10B981' : '#FFFFFF',
                              borderColor: isCompleted ? '#10B981' : '#CBD5E1',
                            }}>
                              {isCompleted && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
  content: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1E293B',
    outline: 'none',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
    transition: 'all 0.2s',
    '::placeholder': {
      color: '#94A3B8'
    }
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px'
  },
  emptySearchState: {
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '14px',
  },
  subjectsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
  },
  subjectHeader: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  subjectIcon: {
    fontSize: '24px',
  },
  subjectMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  subjectName: {
    fontSize: '15px',
    fontWeight: '800',
    margin: 0,
  },
  progressText: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '600',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  smallProgressTrack: {
    width: '60px',
    height: '6px',
    backgroundColor: '#E2E8F0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  smallProgressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  topicsContainer: {
    borderTop: '1px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
  },
  topicRow: {
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #F1F5F9',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.15s ease',
    ':last-child': {
      borderBottom: 'none'
    }
  },
  topicText: {
    fontSize: '13px',
    fontWeight: '600',
    flex: 1,
    paddingRight: '12px',
    lineHeight: '1.4',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  }
};
