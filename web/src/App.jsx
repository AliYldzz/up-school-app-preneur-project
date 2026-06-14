import React, { useState } from 'react';
import { API_BASE_URL } from './config';
import Timer from './Timer';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import Settings from './Settings';
import Errors from './Errors';
import Lessons from './Lessons';
import Admin from './Admin';
import { supabase } from './supabaseClient';
import { rescheduleStudyPlan } from './aiService';

const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalDateStringForDate = (d) => {
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const cleanTitle = (title) => {
  return title ? title.replace(/\s*[\(\[](Kolay|Orta|Zor)[\)\]]/gi, '').trim() : '';
};

const INITIAL_PROGRAM = [
  { 
    id: 1, 
    subject: 'MATEMATİK', 
    title: 'Türev - Limit İlişkisi Soru Çözümü',
    timeRange: '90 dakika',
    status: 'completed',
    color: '#3498DB',
    bgColor: '#EBF5FB'
  },
  { 
    id: 2, 
    subject: 'FİZİK', 
    title: 'Modern Fizik: Fotoelektrik Olayı',
    timeRange: '90 dakika',
    status: 'active',
    color: '#FF9875',
    bgColor: '#FFF3F0'
  },
  { 
    id: 3, 
    subject: 'TÜRKÇE', 
    title: 'Paragraf Anlam Bilgisi Denemesi',
    timeRange: '60 dakika',
    status: 'pending',
    color: '#005D32',
    bgColor: '#EBF5EC'
  },
  { 
    id: 4, 
    subject: 'BİYOLOJİ', 
    title: 'Hücresel Solunum Tekrar',
    timeRange: '60 dakika',
    status: 'pending',
    color: '#E67E22',
    bgColor: '#FDF2E9'
  },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return window.innerWidth <= 768;
    } catch (e) {
      return false;
    }
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const [authMode, setAuthMode] = useState('register'); // 'login' or 'register'
  const [currentTab, setCurrentTab] = useState('home'); // 'home' or 'profile'
  const [activeTimerTask, setActiveTimerTask] = useState(null);
  const [program, setProgram] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [selectedIncompleteTasks, setSelectedIncompleteTasks] = useState([]);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [consecutiveLowEnergyCount, setConsecutiveLowEnergyCount] = useState(0);

  const openRescheduleModal = () => {
    const incomplete = program.filter(t => t.status !== 'completed').map(t => t.id);
    setSelectedIncompleteTasks(incomplete);
    setEnergyLevel(3);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = () => {
    const performReschedule = () => {
      setIsRescheduling(true);
      
      let currentUser;
      supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) throw new Error("Giriş yapmalısınız.");
        currentUser = user;
        
        return supabase.from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false);
      })
      .then(({ data: allTasks, error }) => {
        if (error) throw error;
        
        const incomplete = allTasks.filter(t => selectedIncompleteTasks.includes(t.id));
        const other = allTasks.filter(t => !selectedIncompleteTasks.includes(t.id) && t.status !== 'completed');
        
        return rescheduleStudyPlan(
          getDaysRemaining(),
          userTarget,
          userFocus,
          energyLevel,
          incomplete,
          other
        );
      })
      .then(async (rescheduledTasks) => {
        const today = new Date();
        
        // Client-side safety filter: deduplicate rescheduled tasks by task ID
        const uniqueRescheduled = [];
        const seenIds = new Set();
        for (const t of rescheduledTasks) {
          if (!t || !t.id) continue;
          if (!seenIds.has(t.id)) {
            seenIds.add(t.id);
            uniqueRescheduled.push(t);
          }
        }
        
        const updatePromises = uniqueRescheduled.map(t => {
          const offset = t.day_offset !== undefined ? t.day_offset : (t.dayOffset !== undefined ? t.dayOffset : 0);
          const dateStr = getLocalDateString(offset);
          
          return supabase.from('tasks')
            .update({
              estimated_time: t.estimated_time,
              priority_score: t.priority_score,
              status: 'pending',
              scheduled_date: dateStr
            })
            .eq('id', t.id);
        });
        
        await Promise.all(updatePromises);
        
        return supabase.from('tasks')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('is_deleted', false);
      })
      .then(({ data: freshTasks, error }) => {
        if (error) throw error;
        
        setIsRescheduling(false);
        setShowRescheduleModal(false);
        
        const todayStr = getLocalDateString();
        const todayTasks = freshTasks.filter(t => t.scheduled_date === todayStr);
        const formatted = todayTasks.map(ct => ({
          id: ct.id,
          subject: ct.subject_name,
          title: ct.title,
          timeRange: `${ct.estimated_time} dakika`,
          status: ct.status,
          color: ct.subject_name === 'MATEMATİK' ? '#3498DB' : ct.subject_name === 'FİZİK' ? '#FF9875' : ct.subject_name === 'TÜRKÇE' ? '#005D32' : ct.subject_name === 'BİYOLOJİ' ? '#E67E22' : '#717970',
          bgColor: ct.subject_name === 'MATEMATİK' ? '#EBF5FB' : ct.subject_name === 'FİZİK' ? '#FFF3F0' : ct.subject_name === 'TÜRKÇE' ? '#EBF5EC' : ct.subject_name === 'BİYOLOJİ' ? '#FDF2E9' : '#F0F3F1'
        }));
        
        setProgram(formatted);
        triggerStatsUpdate();
        alert('Yapay zeka planınızı güncelledi! ✨');
      })
      .catch(err => {
        setIsRescheduling(false);
        alert(err.message || 'Plan yeniden düzenlenirken bir hata oluştu.');
      });
    };

    if (energyLevel <= 2) {
      const nextCount = consecutiveLowEnergyCount + 1;
      setConsecutiveLowEnergyCount(nextCount);
      if (nextCount >= 3) {
        const confirmReschedule = window.confirm(
          "Meydan Okuma Zamanı! 🎯\n\nÜst üste 3 kez düşük enerji seviyesi seçtin. Unutma, YKS sürecinde disiplin ve süreklilik şampiyonları belirler! Biraz gayret edip bugün kendine meydan okumaya ne dersin? Yeni rotayı yine de oluşturmak istiyor musun?"
        );
        if (!confirmReschedule) {
          return;
        }
      }
    } else {
      setConsecutiveLowEnergyCount(0);
    }

    performReschedule();
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
      supabase.auth.getUser()
      .then(({ data: { user }, error }) => {
        if (error || !user) throw new Error('Oturum süresi dolmuş.');
        return supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      })
      .then(({ data, error }) => {
        if (error || !data) throw new Error('Profil yüklenemedi.');
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
  }, []);

  // Get tasks from Supabase when logged in
  React.useEffect(() => {
    if (isLoggedIn) {
      supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) return;
        return supabase.from('tasks').select('*').eq('user_id', user.id).eq('is_deleted', false);
      })
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data || data.length === 0) {
          // Create initial tasks
          supabase.auth.getUser().then(({ data: { user } }) => {
            const todayStr = getLocalDateString();
            const initialTasks = INITIAL_PROGRAM.map(t => ({
              user_id: user.id,
              title: t.title,
              subject_name: t.subject,
              estimated_time: parseInt(t.timeRange) || 60,
              status: t.status === 'active' ? 'active' : t.status === 'completed' ? 'completed' : 'pending',
              scheduled_date: todayStr
            }));
            supabase.from('tasks').insert(initialTasks).select('*')
            .then(({ data: createdTasks, error: insertError }) => {
              if (insertError) throw insertError;
              const todayStr = getLocalDateString();
              const todayTasks = createdTasks.filter(t => t.scheduled_date === todayStr);
              const formatted = todayTasks.map(ct => ({
                id: ct.id,
                subject: ct.subject_name,
                title: ct.title,
                timeRange: `${ct.estimated_time} dakika`,
                status: ct.status,
                color: ct.subject_name === 'MATEMATİK' ? '#3498DB' : ct.subject_name === 'FİZİK' ? '#FF9875' : ct.subject_name === 'TÜRKÇE' ? '#005D32' : ct.subject_name === 'BİYOLOJİ' ? '#E67E22' : '#717970',
                bgColor: ct.subject_name === 'MATEMATİK' ? '#EBF5FB' : ct.subject_name === 'FİZİK' ? '#FFF3F0' : ct.subject_name === 'TÜRKÇE' ? '#EBF5EC' : ct.subject_name === 'BİYOLOJİ' ? '#FDF2E9' : '#F0F3F1'
              }));
              setProgram(formatted);
            });
          });
        } else {
          const todayStr = getLocalDateString();
          const todayTasks = data.filter(t => t.scheduled_date === todayStr);
          const formatted = todayTasks.map(ct => ({
            id: ct.id,
            subject: ct.subject_name,
            title: ct.title,
            timeRange: `${ct.estimated_time} dakika`,
            status: ct.status,
            color: ct.subject_name === 'MATEMATİK' ? '#3498DB' : ct.subject_name === 'FİZİK' ? '#FF9875' : ct.subject_name === 'TÜRKÇE' ? '#005D32' : ct.subject_name === 'BİYOLOJİ' ? '#E67E22' : '#717970',
            bgColor: ct.subject_name === 'MATEMATİK' ? '#EBF5FB' : ct.subject_name === 'FİZİK' ? '#FFF3F0' : ct.subject_name === 'TÜRKÇE' ? '#EBF5EC' : ct.subject_name === 'BİYOLOJİ' ? '#FDF2E9' : '#F0F3F1'
          }));
          setProgram(formatted);
        }
      })
      .catch(err => {
        console.error(err);
      });
    }
  }, [isLoggedIn]);

  // Get user stats from Supabase completed tasks list when logged in or statsTrigger changes
  React.useEffect(() => {
    if (isLoggedIn) {
      supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) return;
        return supabase.from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .eq('is_deleted', false);
      })
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data) return;
        
        const total_solved = data.reduce((sum, t) => sum + (t.questions_solved || 0), 0);
        const total_correct = data.reduce((sum, t) => sum + (t.questions_correct || 0), 0);
        const total_wrong = data.reduce((sum, t) => sum + (t.questions_wrong || 0), 0);
        const total_minutes = data.reduce((sum, t) => sum + (t.actual_time || 0), 0);
        
        const accuracy_rate = total_solved > 0 ? parseFloat(((total_correct / total_solved) * 100).toFixed(1)) : 0.0;
        const total_hours = parseFloat((total_minutes / 60.0).toFixed(1));
        
        const activeDays = new Set();
        data.forEach(t => {
          if (t.created_at) {
            const dateStr = getLocalDateStringForDate(new Date(t.created_at));
            activeDays.add(dateStr);
          }
        });
        
        let streak_days = 0;
        const checkDate = new Date();
        let checkDateStr = getLocalDateStringForDate(checkDate);
        if (!activeDays.has(checkDateStr)) {
          checkDate.setDate(checkDate.getDate() - 1);
          checkDateStr = getLocalDateStringForDate(checkDate);
        }
        
        while (activeDays.has(checkDateStr)) {
          streak_days++;
          checkDate.setDate(checkDate.getDate() - 1);
          checkDateStr = getLocalDateStringForDate(checkDate);
        }
        
        const subjectStats = {};
        data.forEach(t => {
          const subj = t.subject_name || "Diğer";
          if (!subjectStats[subj]) {
            subjectStats[subj] = { solved: 0, correct: 0 };
          }
          subjectStats[subj].solved += (t.questions_solved || 0);
          subjectStats[subj].correct += (t.questions_correct || 0);
        });
        
        const subject_accuracy = Object.keys(subjectStats).map(subj => {
          const s = subjectStats[subj];
          return {
            name: subj,
            percent: s.solved > 0 ? Math.round((s.correct / s.solved) * 100) : 0
          };
        });
        
        if (subject_accuracy.length === 0) {
          subject_accuracy.push({ name: "MATEMATİK", percent: 0 });
        }
        
        const dailyChart = [0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dStr = getLocalDateStringForDate(d);
          
          const dayTasks = data.filter(t => {
            if (!t.created_at) return false;
            return getLocalDateStringForDate(new Date(t.created_at)) === dStr;
          });
          dailyChart[i] = dayTasks.reduce((sum, t) => sum + (t.questions_solved || 0), 0);
        }
        
        const maxVal = Math.max(...dailyChart);
        const daily_chart = dailyChart.map(v => maxVal > 0 ? Math.round((v / maxVal) * 100) : 0);
        
        setUserStats({
          total_solved,
          total_correct,
          total_wrong,
          accuracy_rate,
          total_hours,
          daily_chart,
          streak_days,
          subject_accuracy
        });
      })
      .catch(err => {
        console.error("Stats calculation error:", err);
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
    supabase.from('tasks')
      .update({
        status: 'completed',
        questions_solved: questionStats?.questions_solved || 0,
        questions_correct: questionStats?.questions_correct || 0,
        questions_wrong: questionStats?.questions_wrong || 0,
        actual_time: questionStats?.actual_time || 0
      })
      .eq('id', taskId)
      .then(({ error }) => {
        if (error) throw error;
        triggerStatsUpdate();
        setProgram(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      })
      .catch(err => {
        console.error("Task update error:", err);
      });
    setActiveTimerTask(null);
  };

  const handleTimerBack = (isPaused) => {
    if (isPaused && activeTimerTask) {
      supabase.from('tasks')
        .update({ status: 'paused' })
        .eq('id', activeTimerTask.id)
        .then(({ error }) => {
          if (error) console.error(error);
          setProgram(prev => prev.map(t => t.id === activeTimerTask.id ? { ...t, status: 'paused' } : t));
        });
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
        <div style={isMobile ? styles.container : styles.containerDesktop}>
          <div className="mesh-gradient-bg-light">
            <div className="glowing-orb-1-light"></div>
            <div className="glowing-orb-2-light"></div>
            <div className="glowing-orb-3-light"></div>
          </div>
          <div style={{padding: '40px', textAlign: 'center'}}>
            <h2>Admin Paneline Erişmek İçin Giriş Yapmalısınız</h2>
            <button onClick={() => window.location.href = '/'} style={styles.celebrationButton}>Giriş Yap</button>
          </div>
        </div>
      );
    }

    const renderAuthForm = () => {
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
      return (
        <Login 
          onLoginSuccess={(data) => {
            if (data) {
              setUserName(data.fullName);
              setUserTarget(data.target_goal);
              setUserFocus(data.focus_area);
              setProfilePic(data.profile_pic);
            }
            setIsLoggedIn(true);
          }} 
          onRegisterClick={() => setAuthMode('register')} 
        />
      );
    };

    return (
      <div style={isMobile ? styles.container : styles.containerDesktop}>
        <div className="mesh-gradient-bg-light">
          <div className="glowing-orb-1-light"></div>
          <div className="glowing-orb-2-light"></div>
          <div className="glowing-orb-3-light"></div>
        </div>
        {renderAuthForm()}
      </div>
    );
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
            supabase.auth.getUser()
            .then(({ data: { user } }) => {
              if (!user) return;
              return supabase.from('users').update({
                fullName: name,
                target_goal: target,
                focus_area: focus,
                profile_pic: pic
              }).eq('id', user.id).select('*').single();
            })
            .then(({ data, error }) => {
              if (error) throw error;
              setUserName(data.fullName);
              setUserTarget(data.target_goal);
              setUserFocus(data.focus_area);
              if (data.profile_pic) setProfilePic(data.profile_pic);
            })
            .catch(err => {
              console.error(err);
              alert('Hedefler güncellenirken bir hata oluştu.');
            });
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
              <span style={styles.streakText}>{userStats.streak_days || 0} Gün</span>
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
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <h4 style={styles.taskTitle}>{cleanTitle(item.title)}</h4>
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

  if (isMobile) {
    return (
      <div style={styles.container}>
        <div className="mesh-gradient-bg">
          <div className="glowing-orb-1"></div>
          <div className="glowing-orb-2"></div>
          <div className="glowing-orb-3"></div>
        </div>

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
                          <span style={styles.rescheduleTaskTitle}>{cleanTitle(t.title)}</span>
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

        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          {renderContent()}
        </div>

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

  // Desktop Responsive Premium Dashboard Layout
  return (
    <div style={styles.containerDesktop}>
      <div className="mesh-gradient-bg">
        <div className="glowing-orb-1"></div>
        <div className="glowing-orb-2"></div>
        <div className="glowing-orb-3"></div>
      </div>

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
                        <span style={styles.rescheduleTaskTitle}>{cleanTitle(t.title)}</span>
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

      {/* Desktop Sidebar Nav */}
      <div style={styles.sidebarDesktop}>
        <div>
          <div style={styles.sidebarBrand}>
            <span style={{ fontSize: '28px' }}>🎯</span>
            <span style={{ background: 'linear-gradient(135deg, #005D32 0%, #3498DB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900' }}>AI YKS Koçu</span>
          </div>
          
          <div style={styles.sidebarNav}>
            <div 
              style={currentTab === 'home' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
              onClick={() => setCurrentTab('home')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Panel</span>
            </div>

            <div 
              style={currentTab === 'lessons' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
              onClick={() => setCurrentTab('lessons')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>Dersler</span>
            </div>

            <div 
              style={currentTab === 'errors' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
              onClick={() => setCurrentTab('errors')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>Hatalar</span>
            </div>

            <div 
              style={currentTab === 'profile' || currentTab === 'settings' ? styles.sidebarNavItemActive : styles.sidebarNavItem}
              onClick={() => setCurrentTab('profile')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profil</span>
            </div>
          </div>
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.desktopProfileSummary}>
            <div style={{...styles.profileCircle, width: '44px', height: '44px', padding: profilePic ? 0 : '8px', border: '2px solid #2ECC71'}}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#94A3B8">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#2E3A2F', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{userName}</span>
              <span style={{ fontSize: '11px', color: '#5B6E5D', fontWeight: '600' }}>{userFocus} Odak</span>
            </div>
          </div>
          <button style={styles.desktopLogoutBtn} onClick={handleLogout}>Oturumu Kapat</button>
        </div>
      </div>

      {/* Desktop Main Content Area */}
      <div style={styles.mainDesktop}>
        <div style={styles.mainDesktopInner}>
          {currentTab === 'home' ? (
            <div style={styles.dashboardGrid}>
              {/* Sol Taraf: Hoş geldin ve Görevler */}
              <div style={styles.dashboardLeft}>
                <div style={styles.desktopWelcomeCard}>
                  <div style={styles.desktopWelcomeLeft}>
                    <span style={{ fontSize: '11px', color: '#2ECC71', fontWeight: '800', letterSpacing: '1.5px' }}>YKS 2026 SERÜVENİ</span>
                    <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#FFFFFF', margin: '4px 0 0 0' }}>Tekrar hoş geldin, {userName}!</h1>
                    <p style={{ fontSize: '14px', color: '#D5DDD6', margin: '4px 0 0 0', fontWeight: '500' }}>Bugün hedeflerine ulaşmak için harika bir gün. Odaklan ve başla! 🚀</p>
                  </div>
                  
                  <div style={{...styles.streakBadge, padding: '10px 18px', borderRadius: '20px', backgroundColor: '#FF9875'}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1B2A1C">
                      <path d="M19.48,13.03C19.48,13.03 19.48,13.03 19.48,13.03C19.48,17.15 16.13,20.5 12,20.5C7.87,20.5 4.52,17.15 4.52,13.03C4.52,10.05 6.07,7.24 8.61,5.65C8.95,5.44 9.38,5.63 9.49,6.01C9.8,7.11 10.37,8.08 11.13,8.84C11.52,9.23 12.16,9.08 12.35,8.56C12.8,7.3 12.87,5.92 12.56,4.64C12.45,4.19 12.83,3.78 13.29,3.87C16.92,4.61 19.48,8.55 19.48,13.03Z" />
                    </svg>
                    <span style={{...styles.streakText, fontSize: '14px', fontWeight: '800', color: '#1B2A1C'}}>{userStats.streak_days || 0} Günlük Seri</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h3 style={{ ...styles.sectionTitleLeft, fontSize: '20px', marginLeft: 0, color: '#2E3A2F' }}>Bugünkü Görevler</h3>
                  </div>
                  
                  <div style={styles.taskList}>
                    {program.map((item) => (
                      <div 
                        key={item.id} 
                        className="hover-lift"
                        style={{
                          ...styles.taskCard,
                          ...((item.status === 'active' || item.status === 'paused') ? styles.taskCardActive : {}),
                          cursor: item.status !== 'completed' ? 'pointer' : 'default',
                          backgroundColor: '#FFFFFF',
                          borderColor: (item.status === 'active' || item.status === 'paused') ? '#3498DB' : '#CAD5CD'
                        }}
                        onClick={() => handleTaskClick(item)}
                      >
                        <div style={styles.taskIconContainer}>
                          {item.status === 'completed' && (
                            <div style={{...styles.iconCircle, backgroundColor: 'rgba(16, 185, 129, 0.15)'}}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                            </div>
                          )}
                          {item.status === 'paused' && (
                            <div style={{...styles.iconCircle, backgroundColor: 'rgba(217, 119, 6, 0.15)'}}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>
                              </svg>
                            </div>
                          )}
                          {(item.status === 'active' || item.status === 'pending') && (
                            <div style={{...styles.iconCircle, backgroundColor: 'rgba(2, 132, 199, 0.15)'}}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: 2}}>
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                            </div>
                          )}
                        </div>

                        <div style={styles.taskContent}>
                          <div style={styles.taskMetaRow}>
                            <div style={{...styles.subjectBadge, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)'}}>
                              <span style={{...styles.subjectBadgeText, color: item.color}}>{item.subject}</span>
                            </div>
                            {item.status === 'paused' ? (
                              <span style={{...styles.nowBadge, color: '#D97706'}}>DEVAM EDİYOR</span>
                            ) : (
                              <span style={{...styles.timeRangeText, color: '#94A3B8'}}>{item.timeRange}</span>
                            )}
                          </div>
                          <h4 style={{...styles.taskTitle, color: '#2E3A2F', fontSize: '15px'}}>{cleanTitle(item.title)}</h4>
                        </div>

                        <div style={styles.kebabButton}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sağ Taraf: İlerleme, Sayaç, Plan Kurtarma ve İstatistikler */}
              <div style={styles.dashboardRight}>
                {/* İlerleme */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={styles.progressHeader}>
                    <span style={{...styles.sectionTitle, fontSize: '15px'}}>Bugünün İlerlemesi</span>
                    <span style={{...styles.progressText, color: '#2ECC71'}}>{completedTasks} / {totalTasks}</span>
                  </div>
                  <div style={{...styles.progressBarBackground, height: '14px', backgroundColor: 'rgba(255,255,255,0.04)'}}>
                    <div style={{...styles.progressBarFill, backgroundColor: '#2ECC71', width: `${progressPercent}%`}} />
                    <div style={{...styles.milestone, left: '25%'}} />
                    <div style={{...styles.milestone, left: '50%'}} />
                    <div style={{...styles.milestone, left: '75%'}} />
                  </div>
                </div>

                {/* Sayaç */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={styles.countdownLeft}>
                    <span style={{...styles.countdownLabel, color: '#3498DB', fontSize: '11px'}}>YKS 2026'YA KALAN SÜRE</span>
                    <div style={styles.countdownTarget}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#3498DB">
                        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                      </svg>
                      <span style={{...styles.countdownTargetText, color: '#6C7E6E'}}>Hedef: {userTarget}</span>
                    </div>
                  </div>
                  <div style={styles.countdownRight}>
                    <span style={styles.countdownBigText}>{getDaysRemaining()}</span>
                    <span style={styles.countdownSmallText}>GÜN</span>
                  </div>
                </div>

                {/* Yapay Zeka Planı Kurtar Butonu */}
                {program.filter(t => t.status !== 'completed').length > 0 && (
                  <button 
                    className="glow-button hover-lift"
                    style={{...styles.aiMagicBtn, marginBottom: 0}}
                    onClick={openRescheduleModal}
                    disabled={isRescheduling}
                  >
                    <span style={styles.aiMagicIcon}>✨</span> 
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '16px'}}>
                      <span style={styles.aiMagicTitle}>{isRescheduling ? 'Planlanıyor...' : 'Yapay Zeka: Planı Kurtar'}</span>
                      <span style={styles.aiMagicSubtitle}>Gecikmeleri telafi et, yeni rota oluştur</span>
                    </div>
                    {isRescheduling && <div className="pulse-indicator" style={styles.loadingPulse}></div>}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Alt Sekmeler (Dersler, Hatalar, Profil, Ayarlar) */
            <div className="glass-panel" style={{ width: '100%', padding: '16px', boxSizing: 'border-box', overflow: 'hidden' }}>
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#EBF0EC',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
  },
  containerDesktop: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: '100vh',
    width: '100%',
    fontFamily: "'Lexend', sans-serif",
    position: 'relative',
    color: '#1B2A1C',
  },
  sidebarDesktop: {
    width: '280px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #D5DDD6',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '32px 24px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    boxSizing: 'border-box',
    boxShadow: '4px 0 15px rgba(46, 58, 47, 0.02)',
  },
  sidebarBrand: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#005D32',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '40px',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
  },
  sidebarNavItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 18px',
    borderRadius: '16px',
    color: '#4A5D4C',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '600',
    fontSize: '15px',
  },
  sidebarNavItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 18px',
    borderRadius: '16px',
    color: '#FFFFFF',
    backgroundColor: '#005D32',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '700',
    fontSize: '15px',
  },
  sidebarFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    borderTop: '1px solid #E2E8F0',
    paddingTop: '20px',
  },
  mainDesktop: {
    flex: 1,
    padding: '40px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto',
  },
  mainDesktopInner: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '32px',
    alignItems: 'start',
    width: '100%',
  },
  dashboardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  dashboardRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    position: 'sticky',
    top: '40px',
  },
  desktopWelcomeCard: {
    padding: '32px',
    background: '#1B2A1C',
    borderRadius: '24px',
    border: '1px solid #2ECC71',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desktopWelcomeLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  desktopProfileSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  desktopLogoutBtn: {
    padding: '12px 18px',
    borderRadius: '12px',
    border: '1px solid rgba(192, 57, 43, 0.3)',
    backgroundColor: 'rgba(192, 57, 43, 0.05)',
    color: '#C0392B',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
    backgroundColor: '#FF9875',
    padding: '6px 10px',
    borderRadius: '16px',
    borderTopLeftRadius: '24px',
    borderBottomRightRadius: '24px',
    gap: '4px',
  },
  streakText: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#1B2A1C',
  },
  welcomeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#4A5D4C',
    letterSpacing: '0.5px'
  },
  nameText: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#1B2A1C',
    marginTop: '2px',
  },
  levelBadge: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FDEBD0',
    padding: '4px 10px',
    borderRadius: '12px',
    marginTop: '6px',
    gap: '4px',
  },
  levelText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#B3B6B7',
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
    color: '#1B2A1C',
  },
  progressText: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#3498DB',
  },
  progressBarBackground: {
    height: '12px',
    backgroundColor: '#EBF0EC',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #D5DDD6',
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
    border: '1px solid #CAD5CD',
    boxShadow: '0 8px 16px rgba(46, 58, 47, 0.03)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  taskCardActive: {
    borderColor: '#3498DB',
    borderWidth: '2px',
    padding: '17px',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.12)',
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
    backgroundColor: '#EBF5FB', 
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #AED6F1',
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
    color: '#3498DB',
  },
  countdownRight: {
    backgroundColor: '#FFFFFF',
    padding: '10px 16px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(52, 152, 219, 0.05)',
    border: '1px solid #AED6F1',
  },
  countdownBigText: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1B2A1C',
    lineHeight: '28px',
  },
  countdownSmallText: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#6C7E6E',
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
    borderTop: '1px solid #D5DDD6',
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
    color: '#6C7E6E',
    cursor: 'pointer',
  },
  navItemActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    color: '#2ECC71',
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
    backgroundColor: '#005D32',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 48px',
    fontSize: '18px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(0, 93, 50, 0.4)',
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
    background: 'linear-gradient(135deg, #005D32 0%, #004D25 100%)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 10px 25px -5px rgba(0, 93, 50, 0.4)',
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
    color: '#6C7E6E',
    border: '1px solid #D5DDD6',
    padding: '14px 0',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  rescheduleConfirmBtn: {
    flex: 2,
    backgroundColor: '#3498DB',
    color: '#FFFFFF',
    border: 'none',
    padding: '14px 0',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(52, 152, 219, 0.2)',
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
