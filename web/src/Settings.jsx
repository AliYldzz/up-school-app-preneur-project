import React from 'react';

export default function Settings({ onBack }) {
  const sections = [
    {
      title: 'Hesap Ayarları',
      items: [
        { icon: '👤', label: 'Profil Bilgilerini Düzenle', description: 'İsim, hedef ve okul bilgilerini güncelle' },
        { icon: '📧', label: 'E-posta Değiştir', description: 'mevcut: mert.yilmaz@example.com' },
        { icon: '🔒', label: 'Şifre ve Güvenlik', description: 'Şifreni yenile ve 2FA ayarla' }
      ]
    },
    {
      title: 'Uygulama Ayarları',
      items: [
        { icon: '🔔', label: 'Bildirimler', description: 'Ders hatırlatıcıları ve motivasyon mesajları' },
        { icon: '🌙', label: 'Görünüm', description: 'Koyu mod ve tema renkleri' },
        { icon: '🌐', label: 'Dil', description: 'Türkçe (Varsayılan)' }
      ]
    },
    {
      title: 'Destek & Bilgi',
      items: [
        { icon: '❓', label: 'Yardım Merkezi', description: 'Sıkça sorulan sorular' },
        { icon: '📝', label: 'Geri Bildirim', description: 'Uygulamayı geliştirmemize yardımcı ol' },
        { icon: 'ℹ️', label: 'Hakkında', description: 'Versiyon 1.2.0' }
      ]
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <span style={styles.headerTitle}>Ayarlar</span>
      </div>

      <div style={styles.content}>
        {sections.map((section, idx) => (
          <div key={idx} style={styles.section}>
            <h3 style={styles.sectionTitle}>{section.title}</h3>
            <div style={styles.itemsList}>
              {section.items.map((item, i) => (
                <div key={i} style={styles.item}>
                  <div style={styles.itemIcon}>{item.icon}</div>
                  <div style={styles.itemContent}>
                    <div style={styles.itemLabel}>{item.label}</div>
                    <div style={styles.itemDescription}>{item.description}</div>
                  </div>
                  <div style={styles.chevron}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                      <path d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button style={styles.logoutButton}>Oturumu Kapat</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '440px',
    margin: '0 auto',
    paddingBottom: '100px',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: '24px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
  },
  backButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#1E293B',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    paddingLeft: '4px',
  },
  itemsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    gap: '16px',
    cursor: 'pointer',
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.2s',
  },
  itemIcon: {
    fontSize: '20px',
    width: '40px',
    height: '40px',
    backgroundColor: '#F1F5F9',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1E293B',
  },
  itemDescription: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: '12px',
    padding: '16px',
    borderRadius: '16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #FEE2E2',
    color: '#EF4444',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
};
