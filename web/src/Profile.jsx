import React from 'react';

export default function Profile({ onSettings, profilePic, userName, userTarget, userFocus, userStats, onUpdateProfile }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(userName);
  const [target, setTarget] = React.useState(userTarget);
  const [focus, setFocus] = React.useState(userFocus);

  React.useEffect(() => {
    setName(userName);
    setTarget(userTarget);
    setFocus(userFocus);
  }, [userName, userTarget, userFocus]);

  const performanceStats = [
    { label: 'Çözülen Soru', value: userStats?.total_solved?.toLocaleString() || '0', color: '#3498DB' },
    { label: 'Doğruluk Oranı', value: `${userStats?.accuracy_rate || 0}%`, color: '#2ECC71' },
    { label: 'Doğru / Yanlış', value: `${userStats?.total_correct || 0} / ${userStats?.total_wrong || 0}`, color: '#FF9875' },
    { label: 'Toplam Saat', value: userStats?.total_hours || '0', color: '#717970' },
  ];

  // Son 7 günün etiketleri (Bugünden geriye doğru)
  const getDayLabels = () => {
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return i === 6 ? 'Bugün' : days[d.getDay()];
    });
  };
  const dayLabels = getDayLabels();

  // Backend'den gelen gerçek veriyi kullan, yoksa sıfır göster
  const chartData = userStats?.daily_chart || [0, 0, 0, 0, 0, 0, 0];
  // Tooltip için gerçek soru adedi (normalize edilmemiş)
  // Backend normalize değer gönderiyor (0-100), ham soru sayılarını tutmak için userStats'tan al
  const hasData = chartData.some(v => v > 0);

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
          {isEditing ? (
            <div style={styles.editForm}>
              <h3 style={styles.editFormTitle}>Hedefleri Düzenle 🎯</h3>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Ad Soyad</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Alan Odak</label>
                <select 
                  value={focus} 
                  onChange={(e) => setFocus(e.target.value)} 
                  style={styles.formSelect}
                >
                  <option value="Sayısal">Sayısal</option>
                  <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                  <option value="Sözel">Sözel</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Hedef Bölüm / Sıralama</label>
                <input 
                  type="text" 
                  value={target} 
                  onChange={(e) => setTarget(e.target.value)} 
                  style={styles.formInput}
                />
              </div>

              <div style={styles.editActionRow}>
                <button 
                  style={styles.saveButton} 
                  onClick={() => {
                    if (onUpdateProfile) {
                      onUpdateProfile(name, target, focus);
                    }
                    setIsEditing(false);
                  }}
                >
                  Kaydet
                </button>
                <button 
                  style={styles.cancelButton} 
                  onClick={() => {
                    setName(userName);
                    setTarget(userTarget);
                    setFocus(userFocus);
                    setIsEditing(false);
                  }}
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={styles.userSection}>
                <div style={styles.avatarContainer}>
                  <div style={styles.avatarBorder}>
                    <img 
                      src={profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Mert"} 
                      alt="Avatar" 
                      style={{...styles.avatar, objectFit: profilePic ? 'cover' : 'contain'}} 
                    />
                  </div>
                </div>
                <div style={styles.userInfo}>
                  <h2 style={styles.userName}>{userName || 'Misafir Kullanıcı'}</h2>
                  <p style={styles.userSubtitle}>
                    {userFocus || 'Sayısal'} Öğrencisi<br/>
                    Hedef: {userTarget || 'Tıp Fakültesi'}
                  </p>
                </div>
              </div>
              <div style={styles.actionButtons}>
                <button style={styles.primaryButton} onClick={() => setIsEditing(true)}>Hedefleri Düzenle</button>
                <button style={styles.secondaryButton} onClick={onSettings}>Ayarlar</button>
              </div>
            </>
          )}
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
            {chartData.map((val, i) => {
              const isToday = i === 6;
              const isEmpty = val === 0;
              return (
                <div key={i} style={styles.barWrapper} title={`${dayLabels[i]}: ${isEmpty ? '0 soru' : val + '% yoğunluk'}`}>
                  <div
                    style={{
                      ...styles.bar,
                      height: `${Math.max(val, hasData ? 5 : 15)}%`,
                      background: isToday
                        ? 'linear-gradient(180deg, #2ECC71 0%, #16A34A 100%)'
                        : isEmpty
                        ? '#E2E8F0'
                        : 'linear-gradient(180deg, #6EE7B7 0%, #34D399 100%)',
                      boxShadow: isToday ? '0 2px 8px rgba(46,204,113,0.4)' : 'none',
                      transition: 'height 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  />
                  <span style={{
                    ...styles.dayLabel,
                    color: isToday ? '#005D32' : '#6C7E6E',
                    fontWeight: isToday ? '700' : '500',
                  }}>{dayLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject Success Card */}
        <div style={{...styles.card, backgroundColor: '#EBF5EC'}}>
          <h3 style={{...styles.cardTitle, marginBottom: '20px'}}>Ders Bazlı Başarı</h3>
          
          {[
            { name: 'Matematik', percent: 92, color: '#3498DB' },
            { name: 'Fizik', percent: 78, color: '#FF9875' },
            { name: 'Kimya', percent: 65, color: '#717970' }
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
    paddingBottom: '100px',
  },
  header: {
    padding: '24px 16px 16px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#4A5D4C',
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
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
    border: '1px solid #D5DDD6',
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
    backgroundColor: '#F3F6F4',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1B2A1C',
    margin: '0 0 4px 0',
  },
  userSubtitle: {
    fontSize: '14px',
    color: '#4A5D4C',
    margin: 0,
    lineHeight: '1.4',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#005D32',
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
    color: '#1B2A1C',
    border: '1px solid #D5DDD6',
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
    color: '#1B2A1C',
    margin: 0,
  },
  badge: {
    backgroundColor: '#EBF5FB',
    color: '#3498DB',
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
    color: '#6C7E6E',
  },
  chartContainer: {
    height: '110px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '6px',
    padding: '0 4px',
  },
  barWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    height: '100%',
    justifyContent: 'flex-end',
    cursor: 'default',
  },
  bar: {
    width: '100%',
    borderRadius: '6px 6px 0 0',
    minHeight: '6px',
    transition: 'height 0.5s ease',
  },
  dayLabel: {
    fontSize: '9px',
    letterSpacing: '0.3px',
    textAlign: 'center',
    userSelect: 'none',
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
    color: '#4A5D4C',
  },
  subjectPercent: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#3498DB',
  },
  progressTrack: {
    height: '8px',
    backgroundColor: '#EBF0EC',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease-out',
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  editFormTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#1B2A1C',
    margin: '0 0 4px 0',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#6C7E6E',
  },
  formInput: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #D5DDD6',
    fontSize: '14px',
    color: '#1B2A1C',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    backgroundColor: '#F3F6F4',
  },
  formSelect: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #D5DDD6',
    fontSize: '14px',
    color: '#1B2A1C',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    backgroundColor: '#F3F6F4',
    boxSizing: 'border-box',
  },
  editActionRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#005D32',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    color: '#6C7E6E',
    border: '1px solid #D5DDD6',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
