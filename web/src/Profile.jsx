import React from 'react';

export default function Profile({ onSettings }) {
  const performanceStats = [
    { label: 'Çözülen Soru', value: '2,450', color: '#3498DB' },
    { label: 'Doğruluk Oranı', value: '84%', color: '#2ECC71' },
    { label: 'Kazanılan Rozet', value: '42', color: '#F59E0B' },
    { label: 'Toplam Saat', value: '128', color: '#8B5CF6' },
  ];

  const chartData = [40, 60, 55, 85, 70, 95, 30];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span style={styles.headerText}>Profil & Performans</span>
        </div>
      </div>

      <div style={styles.content}>
        {/* User Card */}
        <div style={styles.card}>
          <div style={styles.userSection}>
            <div style={styles.avatarContainer}>
              <div style={styles.avatarBorder}>
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mert" 
                  alt="Avatar" 
                  style={styles.avatar} 
                />
              </div>
            </div>
            <div style={styles.userInfo}>
              <h2 style={styles.userName}>Mert Yılmaz</h2>
              <p style={styles.userSubtitle}>Sayısal Öğrencisi • Hedef: Tıp Fakültesi</p>
            </div>
          </div>
          <div style={styles.actionButtons}>
            <button style={styles.primaryButton}>Hedefleri Düzenle</button>
            <button style={styles.secondaryButton} onClick={onSettings}>Ayarlar</button>
          </div>
        </div>

        {/* Performance Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Genel Performans</h3>
            <div style={styles.badge}>+14% bu hafta</div>
          </div>

          <div style={styles.statsGrid}>
            {performanceStats.map((stat, i) => (
              <div key={i} style={styles.statItem}>
                <span style={{ ...styles.statValue, color: stat.color }}>{stat.value}</span>
                <span style={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>

          <div style={styles.chartContainer}>
            {chartData.map((val, i) => (
              <div 
                key={i} 
                style={{ 
                  ...styles.bar, 
                  height: `${val}%`,
                  backgroundColor: i === 5 ? '#2ECC71' : '#A7F3D0'
                }} 
              />
            ))}
          </div>
        </div>

        {/* Subject Success Card */}
        <div style={{...styles.card, backgroundColor: '#F0FDF4'}}>
          <h3 style={{...styles.cardTitle, marginBottom: '20px'}}>Ders Bazlı Başarı</h3>
          
          {[
            { name: 'Matematik', percent: 92, color: '#3B82F6' },
            { name: 'Fizik', percent: 78, color: '#3B82F6' },
            { name: 'Kimya', percent: 65, color: '#3B82F6' }
          ].map((item, i) => (
            <div key={i} style={styles.subjectRow}>
              <div style={styles.subjectMeta}>
                <span style={styles.subjectName}>{item.name}</span>
                <span style={styles.subjectPercent}>{item.percent}%</span>
              </div>
              <div style={styles.progressTrack}>
                <div style={{...styles.progressFill, width: `${item.percent}%`, backgroundColor: item.color}} />
              </div>
            </div>
          ))}
        </div>
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
  },
  header: {
    padding: '24px 16px 16px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#64748B',
    fontSize: '18px',
    fontWeight: '600',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '0 16px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    border: '1px solid #E2E8F0',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '24px',
  },
  avatarContainer: {
    width: '80px',
    height: '80px',
  },
  avatarBorder: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '4px solid #2ECC71',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#F1F5F9',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#243B55',
    margin: '0 0 4px 0',
  },
  userSubtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
    lineHeight: '1.4',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#065F46', // Koyu yeşil (görseldeki gibi)
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    color: '#243B55',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#243B55',
    margin: 0,
  },
  badge: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '32px',
    padding: '0 12px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94A3B8',
  },
  chartContainer: {
    height: '100px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '0 8px',
  },
  bar: {
    flex: 1,
    borderRadius: '6px 6px 0 0',
    minHeight: '10%',
  },
  subjectRow: {
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  subjectMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
  },
  subjectPercent: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#3B82F6',
  },
  progressTrack: {
    height: '8px',
    backgroundColor: '#E2E8F0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease-out',
  }
};
