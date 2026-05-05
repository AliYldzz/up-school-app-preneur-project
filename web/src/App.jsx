import React, { useState } from 'react';
import Timer from './Timer';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import Settings from './Settings';

const INITIAL_PROGRAM = [
  { 
    id: 1, 
    subject: 'MATEMATİK', 
    title: 'Türev - Limit İlişkisi Soru Çözümü',
    timeRange: '90 dakika',
    status: 'completed',
    color: '#3B82F6',
    bgColor: '#EFF6FF'
  },
  { 
    id: 2, 
    subject: 'FİZİK', 
    title: 'Modern Fizik: Fotoelektrik Olayı',
    timeRange: '90 dakika',
    status: 'active',
    color: '#EF4444',
    bgColor: '#FEF2F2'
  },
  { 
    id: 3, 
    subject: 'TÜRKÇE', 
    title: 'Paragraf Anlam Bilgisi Denemesi',
    timeRange: '60 dakika',
    status: 'pending',
    color: '#8B5CF6',
    bgColor: '#F5F3FF'
  },
  { 
    id: 4, 
    subject: 'BİYOLOJİ', 
    title: 'Hücresel Solunum Tekrar',
    timeRange: '60 dakika',
    status: 'pending',
    color: '#F97316',
    bgColor: '#FFF7ED'
  },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [currentTab, setCurrentTab] = useState('home'); // 'home' or 'profile'
  const [activeTimerTask, setActiveTimerTask] = useState(null);
  const [program, setProgram] = useState(INITIAL_PROGRAM);
  const [showCelebration, setShowCelebration] = useState(false);

  const completedTasks = program.filter(t => t.status === 'completed').length;
  const totalTasks = program.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  React.useEffect(() => {
    if (completedTasks === totalTasks && totalTasks > 0) {
      setShowCelebration(true);
    }
  }, [completedTasks, totalTasks]);

  const handleTaskComplete = (taskId) => {
    setProgram(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
    setActiveTimerTask(null);
  };

  const handleTimerBack = (isPaused) => {
    if (isPaused) {
      setProgram(prev => prev.map(t => t.id === activeTimerTask.id ? { ...t, status: 'paused' } : t));
    }
    setActiveTimerTask(null);
  };

  const handleTaskClick = (item) => {
    if (item.status === 'active' || item.status === 'pending' || item.status === 'paused') {
      setActiveTimerTask(item);
    }
  };

  if (!isLoggedIn) {
    if (authMode === 'register') {
      return <Register onBack={() => setAuthMode('login')} onRegisterSuccess={() => setIsLoggedIn(true)} />;
    }
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} onRegisterClick={() => setAuthMode('register')} />;
  }

  if (activeTimerTask) {
    return <Timer task={activeTimerTask} onBack={(data) => handleTimerBack(data?.isPaused)} onComplete={() => handleTaskComplete(activeTimerTask.id)} />;
  }

  const renderContent = () => {
    if (currentTab === 'profile') {
      return <Profile onSettings={() => setCurrentTab('settings')} />;
    }

    if (currentTab === 'settings') {
      return <Settings onBack={() => setCurrentTab('profile')} />;
    }

    return (
      <div style={styles.content}>
        
        <div style={styles.mainCard}>
          
          <div style={styles.headerRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{...styles.profileCircle, cursor: 'pointer'}}
                onClick={() => setCurrentTab('profile')}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#94A3B8">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <button 
                style={styles.logoutButton} 
                onClick={() => setIsLoggedIn(false)}
                title="Çıkış Yap"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
            <div style={styles.streakBadge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFF">
                <path d="M19.48,13.03C19.48,13.03 19.48,13.03 19.48,13.03C19.48,17.15 16.13,20.5 12,20.5C7.87,20.5 4.52,17.15 4.52,13.03C4.52,10.05 6.07,7.24 8.61,5.65C8.95,5.44 9.38,5.63 9.49,6.01C9.8,7.11 10.37,8.08 11.13,8.84C11.52,9.23 12.16,9.08 12.35,8.56C12.8,7.3 12.87,5.92 12.56,4.64C12.45,4.19 12.83,3.78 13.29,3.87C16.92,4.61 19.48,8.55 19.48,13.03Z" />
              </svg>
              <span style={styles.streakText}>12 Gün</span>
            </div>
          </div>

          <div style={styles.welcomeContainer}>
            <span style={styles.welcomeText}>Hoş Geldin,</span>
            <span style={styles.nameText}>Geleceğin Şampiyonu</span>
            <div style={styles.levelBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              <span style={styles.levelText}>Seviye 5 • Odak Ustası</span>
            </div>
          </div>

          <div style={styles.progressSection}>
            <div style={styles.progressHeader}>
              <span style={styles.sectionTitle}>Bugünün İlerlemesi</span>
              <span style={styles.progressText}>{completedTasks} / {totalTasks}</span>
            </div>
            <div style={styles.progressBarBackground}>
              <div style={{...styles.progressBarFill, width: `${progressPercent}%`}} />
              <div style={{...styles.milestone, left: '25%'}} />
              <div style={{...styles.milestone, left: '50%'}} />
              <div style={{...styles.milestone, left: '75%'}} />
            </div>
          </div>

          <div style={styles.countdownSection}>
            <div style={styles.countdownLeft}>
              <span style={styles.countdownLabel}>YKS 2026'YA KALAN SÜRE</span>
              <div style={styles.countdownTarget}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#3498DB">
                  <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                </svg>
                <span style={styles.countdownTargetText}>Hedef: İlk 5000</span>
              </div>
            </div>
            <div style={styles.countdownRight}>
              <span style={styles.countdownBigText}>12</span>
              <span style={styles.countdownSmallText}>GÜN</span>
            </div>
          </div>

        </div>

        <div style={styles.programSectionContainer}>
          <h3 style={styles.sectionTitleLeft}>Bugünkü Görevler</h3>
          
          <div style={styles.taskList}>
            {program.map((item) => (
              <div 
                key={item.id} 
                style={{
                  ...styles.taskCard,
                  ...((item.status === 'active' || item.status === 'paused') ? styles.taskCardActive : {}),
                  cursor: item.status !== 'completed' ? 'pointer' : 'default'
                }}
                onClick={() => handleTaskClick(item)}
              >
                <div style={styles.taskIconContainer}>
                  {item.status === 'completed' && (
                    <div style={{...styles.iconCircle, backgroundColor: '#ECFDF5'}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                  )}
                  {item.status === 'paused' && (
                    <div style={{...styles.iconCircle, backgroundColor: '#FEF3C7'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
                      </svg>
                    </div>
                  )}
                  {(item.status === 'active' || item.status === 'pending') && (
                    <div style={{...styles.iconCircle, backgroundColor: '#E0F2FE'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: 2}}>
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  )}
                </div>

                <div style={styles.taskContent}>
                  <div style={styles.taskMetaRow}>
                    <div style={{...styles.subjectBadge, backgroundColor: item.bgColor}}>
                      <span style={{...styles.subjectBadgeText, color: item.color}}>{item.subject}</span>
                    </div>
                    {item.status === 'paused' ? (
                      <span style={{...styles.nowBadge, color: '#D97706'}}>DEVAM EDİYOR</span>
                    ) : (
                      <span style={styles.timeRangeText}>{item.timeRange}</span>
                    )}
                  </div>
                  <h4 style={styles.taskTitle}>{item.title}</h4>
                </div>

                <div style={styles.kebabButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Celebration Modal */}
      {showCelebration && (
        <div style={styles.celebrationOverlay}>
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              style={{
                ...styles.star,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: Math.random(),
              }}
            >
              ★
            </div>
          ))}
          <div style={styles.celebrationModal}>
            <h2 style={styles.celebrationTitle}>Tebrikler!</h2>
            <p style={styles.celebrationText}>Günü Tamamladık</p>
            <button style={styles.celebrationButton} onClick={() => setShowCelebration(false)}>
              Harika!
            </button>
          </div>
        </div>
      )}

      {renderContent()}

      <div style={styles.bottomNavContainer}>
        <div style={styles.bottomNav}>
          <div 
            style={currentTab === 'home' ? styles.navItemActive : styles.navItem}
            onClick={() => setCurrentTab('home')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span style={currentTab === 'home' ? styles.navTextActive : styles.navText}>Panel</span>
          </div>
          <div style={styles.navItem}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span style={styles.navText}>İstanbul</span>
          </div>
          <div style={styles.navItem}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span style={styles.navText}>Hatalar</span>
          </div>
          <div 
            style={currentTab === 'profile' ? styles.navItemActive : styles.navItem}
            onClick={() => setCurrentTab('profile')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span style={currentTab === 'profile' ? styles.navTextActive : styles.navText}>Profil</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#F4F7F9',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
  },
  content: {
    width: '100%',
    maxWidth: '440px',
    padding: '16px',
    paddingBottom: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '16px',
    width: '100%',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxSizing: 'border-box',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    backgroundColor: '#F1F5F9',
    border: '2px solid #CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#FEF2F2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #FEE2E2',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  streakBadge: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    padding: '6px 10px',
    borderRadius: '16px',
    borderTopLeftRadius: '24px',
    borderBottomRightRadius: '24px',
    gap: '4px',
  },
  streakText: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#FFF',
  },
  welcomeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748B',
  },
  nameText: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#243B55',
    marginTop: '2px',
  },
  levelBadge: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: '4px 10px',
    borderRadius: '12px',
    marginTop: '6px',
    gap: '4px',
  },
  levelText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#B45309',
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#243B55',
  },
  progressText: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#3498DB',
  },
  progressBarBackground: {
    height: '12px',
    backgroundColor: '#F1F5F9',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: '6px',
    transition: 'width 0.3s ease',
  },
  milestone: {
    position: 'absolute',
    width: '2px',
    height: '16px',
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
  },
  programSectionContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitleLeft: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1E293B',
    margin: 0,
    marginLeft: '4px',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
    transition: 'all 0.2s',
  },
  taskCardActive: {
    borderColor: '#3B82F6',
    borderWidth: '2px',
    padding: '15px',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
  },
  taskIconContainer: {
    marginRight: '16px',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircleIcon: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px solid #94A3B8',
  },
  taskContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  taskMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  subjectBadge: {
    padding: '2px 6px',
    borderRadius: '6px',
  },
  subjectBadgeText: {
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.5px',
  },
  nowBadge: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: '0.5px',
  },
  timeRangeText: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: '18px',
    margin: 0,
  },
  kebabButton: {
    padding: '4px',
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  countdownSection: {
    backgroundColor: '#F0F9FF', 
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #BAE6FD',
  },
  countdownLeft: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  countdownLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#3498DB',
    marginBottom: '4px',
    letterSpacing: '0.5px',
  },
  countdownTarget: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  countdownTargetText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0369A1',
  },
  countdownRight: {
    backgroundColor: '#FFFFFF',
    padding: '10px 16px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(52, 152, 219, 0.15)',
    border: '1px solid #E0F2FE',
  },
  countdownBigText: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#243B55',
    lineHeight: '28px',
  },
  countdownSmallText: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: '1px',
  },
  bottomNavContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E2E8F0',
    boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.02)',
    zIndex: 10,
  },
  bottomNav: {
    width: '100%',
    maxWidth: '440px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '12px 0 16px 0',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    color: '#94A3B8',
    cursor: 'pointer',
  },
  navItemActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    color: '#10B981',
    cursor: 'pointer',
  },
  navText: {
    fontSize: '11px',
    fontWeight: '600',
  },
  navTextActive: {
    fontSize: '11px',
    fontWeight: '700',
  },
  celebrationOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
    overflow: 'hidden',
  },
  celebrationModal: {
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1001,
    textAlign: 'center',
  },
  celebrationTitle: {
    fontSize: '48px',
    fontWeight: '900',
    color: '#F59E0B',
    margin: '0 0 16px 0',
    textShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
    animation: 'pulse 2s infinite',
  },
  celebrationText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#FFFFFF',
    margin: '0 0 32px 0',
  },
  celebrationButton: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 48px',
    fontSize: '18px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)',
    transition: 'transform 0.2s',
  },
  star: {
    position: 'absolute',
    color: '#F59E0B',
    fontSize: '24px',
    top: '-50px',
    animation: 'fall linear infinite',
  }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fall {
    to {
      transform: translateY(110vh) rotate(360deg);
    }
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default App;
