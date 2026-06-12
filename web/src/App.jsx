import React, { useState } from 'react';
import Timer from './Timer';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import Settings from './Settings';
import Errors from './Errors';
import Lessons from './Lessons';
import Admin from './Admin';

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
  const [profilePic, setProfilePic] = useState(() => {
    try {
      return localStorage.getItem('profilePic') || null;
    } catch (e) {
      console.warn("Could not read profilePic from localStorage:", e);
      return null;
    }
  });
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'Geleceğin Şampiyonu');
  const [userTarget, setUserTarget] = useState(() => localStorage.getItem('userTarget') || 'İlk 5000');
  const [userFocus, setUserFocus] = useState(() => localStorage.getItem('userFocus') || 'Sayısal');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [currentTab, setCurrentTab] = useState('home'); // 'home' or 'profile'
  const [activeTimerTask, setActiveTimerTask] = useState(null);
  const [program, setProgram] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [selectedIncompleteTasks, setSelectedIncompleteTasks] = useState([]);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const openRescheduleModal = () => {
    const incomplete = program.filter(t => t.status !== 'completed').map(t => t.id);
    setSelectedIncompleteTasks(incomplete);
    setEnergyLevel(3);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsRescheduling(true);
    fetch('http://127.0.0.1:8000/api/plan/reschedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reason: 'skipped_by_user',
        incomplete_task_ids: selectedIncompleteTasks,
        current_energy_level: energyLevel
      })
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Yeniden planlama başarısız oldu.');
    })
    .then(data => {
      setIsRescheduling(false);
      setShowRescheduleModal(false);
      
      const formatted = data.scheduled_tasks.map(ct => ({
        id: ct.id,
        subject: ct.subject_name,
        title: ct.title,
        timeRange: `${ct.estimated_time} dakika`,
        status: ct.status,
        color: ct.subject_name === 'MATEMATİK' ? '#3B82F6' : ct.subject_name === 'FİZİK' ? '#EF4444' : ct.subject_name === 'TÜRKÇE' ? '#8B5CF6' : '#F97316',
        bgColor: ct.subject_name === 'MATEMATİK' ? '#EFF6FF' : ct.subject_name === 'FİZİK' ? '#FEF2F2' : ct.subject_name === 'TÜRKÇE' ? '#F5F3FF' : '#FFF7ED'
      }));
      setProgram(formatted);
      triggerStatsUpdate();
    })
    .catch(err => {
      setIsRescheduling(false);
      alert(err.message || 'Plan yeniden düzenlenirken bir hata oluştu.');
    });
  };
  const [userStats, setUserStats] = useState({
    total_solved: 0,
    total_correct: 0,
    total_wrong: 0,
    accuracy_rate: 0,
    total_hours: 0
  });
  const [statsTrigger, setStatsTrigger] = useState(0);
  const triggerStatsUpdate = () => setStatsTrigger(prev => prev + 1);

  const getDaysRemaining = () => {
    const examDate = new Date('2026-06-13T10:00:00'); // YKS 2026
    const today = new Date();
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const completedTasks = program.filter(t => t.status === 'completed').length;
  const totalTasks = program.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  React.useEffect(() => {
    if (completedTasks === totalTasks && totalTasks > 0) {
      setShowCelebration(true);
    }
  }, [completedTasks, totalTasks]);

  // Giriş durumunu ve kullanıcı verilerini API'den yükleme
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://127.0.0.1:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Oturum süresi dolmuş.');
      })
      .then(data => {
        setUserName(data.fullName);
        setUserTarget(data.target_goal);
        setUserFocus(data.focus_area);
        setProfilePic(data.profile_pic);
        setIsLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      });
    }
  }, [isLoggedIn]);

  // Get tasks from API when logged in
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (isLoggedIn && token) {
      fetch('http://127.0.0.1:8000/api/tasks/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Görevler yüklenemedi');
      })
      .then(data => {
        if (data.length === 0) {
          // Create initial tasks in backend
          const createPromises = INITIAL_PROGRAM.map(t => {
            return fetch('http://127.0.0.1:8000/api/tasks/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                title: t.title,
                subject_name: t.subject,
                estimated_time: parseInt(t.timeRange) || 60,
                status: 'pending'
              })
            }).then(r => r.json());
          });
          Promise.all(createPromises).then(createdTasks => {
            const formatted = createdTasks.map(ct => ({
              id: ct.id,
              subject: ct.subject_name,
              title: ct.title,
              timeRange: `${ct.estimated_time} dakika`,
              status: ct.status,
              color: ct.subject_name === 'MATEMATİK' ? '#3B82F6' : ct.subject_name === 'FİZİK' ? '#EF4444' : ct.subject_name === 'TÜRKÇE' ? '#8B5CF6' : '#F97316',
              bgColor: ct.subject_name === 'MATEMATİK' ? '#EFF6FF' : ct.subject_name === 'FİZİK' ? '#FEF2F2' : ct.subject_name === 'TÜRKÇE' ? '#F5F3FF' : '#FFF7ED'
            }));
            setProgram(formatted);
          });
        } else {
          const formatted = data.map(ct => ({
            id: ct.id,
            subject: ct.subject_name,
            title: ct.title,
            timeRange: `${ct.estimated_time} dakika`,
            status: ct.status,
            color: ct.subject_name === 'MATEMATİK' ? '#3B82F6' : ct.subject_name === 'FİZİK' ? '#EF4444' : ct.subject_name === 'TÜRKÇE' ? '#8B5CF6' : '#F97316',
            bgColor: ct.subject_name === 'MATEMATİK' ? '#EFF6FF' : ct.subject_name === 'FİZİK' ? '#FEF2F2' : ct.subject_name === 'TÜRKÇE' ? '#F5F3FF' : '#FFF7ED'
          }));
          setProgram(formatted);
        }
      })
      .catch(err => {
        console.error(err);
      });
    }
  }, [isLoggedIn]);

  // Get user stats from API when logged in or when statsTrigger changes
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (isLoggedIn && token) {
      fetch('http://127.0.0.1:8000/api/auth/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('İstatistikler yüklenemedi');
      })
      .then(data => {
        setUserStats(data);
      })
      .catch(err => {
        console.error(err);
      });
    }
  }, [isLoggedIn, statsTrigger]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setProfilePic(null);
    setUserName('Geleceğin Şampiyonu');
    setUserTarget('İlk 5000');
    setUserFocus('Sayısal');
    setCurrentTab('home');
    setUserStats({
      total_solved: 0,
      total_correct: 0,
      total_wrong: 0,
      accuracy_rate: 0,
      total_hours: 0
    });
  };

  const handleTaskComplete = (taskId, questionStats) => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`http://127.0.0.1:8000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'completed',
          questions_solved: questionStats?.questions_solved || 0,
          questions_correct: questionStats?.questions_correct || 0,
          questions_wrong: questionStats?.questions_wrong || 0,
          actual_time: questionStats?.actual_time || 0
        })
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Görev güncellenemedi');
      })
      .then(() => {
        triggerStatsUpdate();
        setProgram(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      })
      .catch(err => {
        console.error(err);
      });
    }
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

  const isRouteAdmin = window.location.pathname === '/admin';

  if (!isLoggedIn) {
    if (isRouteAdmin) {
      return (
        <div style={styles.container}>
          <div style={{padding: '40px', textAlign: 'center'}}>
            <h2>Admin Paneline Erişmek İçin Giriş Yapmalısınız</h2>
            <button onClick={() => window.location.href = '/'} style={styles.celebrationButton}>Giriş Yap</button>
          </div>
        </div>
      );
    }
    if (authMode === 'register') {
      return (
        <Register 
          onBack={() => setAuthMode('login')} 
          onRegisterSuccess={(pic, name, answers) => {
            if (pic) {
              setProfilePic(pic);
              try {
                localStorage.setItem('profilePic', pic);
              } catch (e) {
                console.warn("Profile picture is too large to store in localStorage:", e);
              }
            } else {
              setProfilePic(null);
              try {
                localStorage.removeItem('profilePic');
              } catch (e) {
                console.warn("Could not remove profilePic from localStorage:", e);
              }
            }
            if (name) {
              setUserName(name);
              localStorage.setItem('userName', name);
            }
            if (answers) {
              if (answers.target) {
                setUserTarget(answers.target);
                localStorage.setItem('userTarget', answers.target);
              }
              if (answers.focus) {
                setUserFocus(answers.focus);
                localStorage.setItem('userFocus', answers.focus);
              }
            }
            setIsLoggedIn(true);
          }} 
        />
      );
    }
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} onRegisterClick={() => setAuthMode('register')} />;
  }

  if (isRouteAdmin) {
    return (
      <Admin 
        onLogout={() => {
          handleLogout();
          window.location.href = '/';
        }} 
      />
    );
  }

  if (activeTimerTask) {
    return <Timer task={activeTimerTask} onBack={(data) => handleTimerBack(data?.isPaused)} onComplete={(stats) => handleTaskComplete(activeTimerTask.id, stats)} />;
  }

  const renderContent = () => {
    if (currentTab === 'profile') {
      return (
        <Profile 
          onSettings={() => setCurrentTab('settings')} 
          profilePic={profilePic} 
          userName={userName} 
          userTarget={userTarget} 
          userFocus={userFocus} 
          userStats={userStats}
          onUpdateProfile={(name, target, focus, pic) => {
            const token = localStorage.getItem('token');
            if (token) {
              fetch('http://127.0.0.1:8000/api/auth/me', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  fullName: name,
                  target_goal: target,
                  focus_area: focus,
                  profile_pic: pic
                })
              })
              .then(res => {
                if (res.ok) return res.json();
                throw new Error('Profil güncellenemedi');
              })
              .then(data => {
                setUserName(data.fullName);
                setUserTarget(data.target_goal);
                setUserFocus(data.focus_area);
                if (data.profile_pic) setProfilePic(data.profile_pic);
              })
              .catch(err => {
                console.error(err);
                alert('Hedefler güncellenirken sunucuda bir hata oluştu.');
              });
            }
          }}
        />
      );
    }

    if (currentTab === 'settings') {
      return <Settings onBack={() => setCurrentTab('profile')} onLogout={handleLogout} />;
    }

    if (currentTab === 'errors') {
      return <Errors onBack={() => setCurrentTab('home')} />;
    }

    if (currentTab === 'lessons') {
      return <Lessons onBack={() => setCurrentTab('home')} />;
    }

    return (
      <div style={styles.content}>
        
        <div className="glass-panel" style={styles.mainCard}>
          
          <div style={styles.headerRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{...styles.profileCircle, cursor: 'pointer', padding: profilePic ? 0 : '12px'}}
                onClick={() => setCurrentTab('profile')}
              >
                {profilePic ? (
                  <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#94A3B8">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
              <button 
                style={styles.logoutButton} 
                onClick={handleLogout}
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
            <span style={styles.welcomeText}>Günaydın şampiyon,</span>
            <span style={styles.nameText}>{userName}!</span>
            <div style={styles.levelBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              <span style={styles.levelText}>Hedeflerine bir adım daha yakınsın 🚀</span>
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
                <span style={styles.countdownTargetText}>Hedef: {userTarget}</span>
              </div>
            </div>
            <div style={styles.countdownRight}>
              <span style={styles.countdownBigText}>{getDaysRemaining()}</span>
              <span style={styles.countdownSmallText}>GÜN</span>
            </div>
          </div>

        </div>

        {program.filter(t => t.status !== 'completed').length > 0 && (
          <button 
            className="glow-button hover-lift"
            style={styles.aiMagicBtn}
            onClick={openRescheduleModal}
            disabled={isRescheduling}
          >
             <span style={styles.aiMagicIcon}>✨</span> 
             <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '12px'}}>
                <span style={styles.aiMagicTitle}>{isRescheduling ? 'Planlanıyor...' : 'Yapay Zeka: Planı Kurtar'}</span>
                <span style={styles.aiMagicSubtitle}>Gecikmeleri telafi et, yeni rota oluştur</span>
             </div>
             {isRescheduling && <div className="pulse-indicator" style={styles.loadingPulse}></div>}
          </button>
        )}

        <div style={styles.programSectionContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingLeft: '4px', boxSizing: 'border-box' }}>
            <h3 style={{ ...styles.sectionTitleLeft, marginLeft: 0 }}>Bugünkü Görevler</h3>
          </div>
          
          <div style={styles.taskList}>
            {program.map((item) => (
              <div 
                key={item.id} 
                className="hover-lift"
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

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div style={styles.rescheduleOverlay} onClick={() => setShowRescheduleModal(false)}>
          <div style={styles.rescheduleModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.rescheduleTitle}>Planı Yeniden Düzenle 🔄</h3>
            <p style={styles.rescheduleSubtitle}>Bugün yapamadığın görevleri ve o anki enerji seviyeni seç, senin için kalan süreyi tekrar planlayalım.</p>
            
            <div style={styles.formGroup}>
              <label style={styles.rescheduleLabel}>Mevcut Enerji Seviyen (1 - 5)</label>
              <div style={styles.energySelector}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnergyLevel(level)}
                    style={{
                      ...styles.energyBtn,
                      backgroundColor: energyLevel === level ? '#3B82F6' : '#F1F5F9',
                      color: energyLevel === level ? '#FFFFFF' : '#475569',
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.rescheduleLabel}>Yapılamayan Görevler</label>
              <div style={styles.rescheduleTaskList}>
                {program.filter(t => t.status !== 'completed').map((t) => {
                  const isChecked = selectedIncompleteTasks.includes(t.id);
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => {
                        setSelectedIncompleteTasks(prev => 
                          prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                        );
                      }}
                      style={{
                        ...styles.rescheduleTaskRow,
                        backgroundColor: isChecked ? '#FEF2F2' : '#FFFFFF',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, textAlign: 'left' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: t.color }}>{t.subject}</span>
                        <span style={styles.rescheduleTaskTitle}>{t.title}</span>
                      </div>
                      <div style={{
                        ...styles.rescheduleCheckbox,
                        backgroundColor: isChecked ? '#EF4444' : '#FFFFFF',
                        borderColor: isChecked ? '#EF4444' : '#CBD5E1',
                      }}>
                        {isChecked && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
                {program.filter(t => t.status !== 'completed').length === 0 && (
                  <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', margin: '12px 0' }}>Bütün görevler tamamlanmış! Yeniden planlama gerekmiyor. 🎉</p>
                )}
              </div>
            </div>

            <div style={styles.rescheduleActions}>
              <button 
                style={styles.rescheduleCancelBtn} 
                onClick={() => setShowRescheduleModal(false)}
                disabled={isRescheduling}
              >
                İptal
              </button>
              <button 
                style={styles.rescheduleConfirmBtn} 
                onClick={handleRescheduleSubmit}
                disabled={isRescheduling || program.filter(t => t.status !== 'completed').length === 0}
              >
                {isRescheduling ? 'Planlanıyor...' : 'Rotayı Güncelle!'}
              </button>
            </div>
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
          <div 
            style={currentTab === 'lessons' ? styles.navItemActive : styles.navItem}
            onClick={() => setCurrentTab('lessons')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span style={currentTab === 'lessons' ? styles.navTextActive : styles.navText}>Dersler</span>
          </div>
          <div 
            style={currentTab === 'errors' ? styles.navItemActive : styles.navItem}
            onClick={() => setCurrentTab('errors')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span style={currentTab === 'errors' ? styles.navTextActive : styles.navText}>Hatalar</span>
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
    padding: '24px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxSizing: 'border-box',
    border: 'none',
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
    fontSize: '14px',
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: '0.5px'
  },
  nameText: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: '2px',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
    fontSize: '14px',
    fontWeight: '800',
    color: '#FFFFFF',
    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
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
    borderRadius: '20px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
  },
  aiMagicBtn: {
    width: '100%',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#FFF',
    marginBottom: '20px',
    position: 'relative'
  },
  aiMagicIcon: {
    fontSize: '32px',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
  },
  aiMagicTitle: {
    fontSize: '16px',
    fontWeight: '800',
    letterSpacing: '0.5px'
  },
  aiMagicSubtitle: {
    fontSize: '12px',
    fontWeight: '500',
    opacity: 0.9,
    marginTop: '2px'
  },
  loadingPulse: {
    position: 'absolute',
    right: '24px',
    width: '24px',
    height: '24px',
    backgroundColor: '#FFF'
  },
  rescheduleOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    boxSizing: 'border-box',
    padding: '16px',
  },
  rescheduleModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  rescheduleTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1E293B',
    margin: 0,
  },
  rescheduleSubtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
    lineHeight: '1.5',
  },
  rescheduleLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#475569',
  },
  energySelector: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  energyBtn: {
    flex: 1,
    border: 'none',
    padding: '10px 0',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  rescheduleTaskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '180px',
    overflowY: 'auto',
    marginTop: '8px',
    paddingRight: '4px',
  },
  rescheduleTaskRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.15s ease',
  },
  rescheduleTaskTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
  },
  rescheduleCheckbox: {
    width: '18px',
    height: '18px',
    borderRadius: '5px',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  rescheduleActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  rescheduleCancelBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    border: '1px solid #E2E8F0',
    padding: '14px 0',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  rescheduleConfirmBtn: {
    flex: 2,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    padding: '14px 0',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)',
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
