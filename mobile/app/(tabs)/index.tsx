import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Dimensions, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { store } from '../../store';
import { API_BASE_URL } from '../../lib/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Star = ({ delay }: { delay: number }) => {
  const fallAnim = useRef(new Animated.Value(-50)).current;
  const leftPos = useRef(Math.random() * SCREEN_WIDTH).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(fallAnim, {
            toValue: SCREEN_HEIGHT + 50,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          })
        ])
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: leftPos,
        transform: [{ translateY: fallAnim }, { rotate: spin }],
      }}
    >
      <Ionicons name="star" size={20} color="#F59E0B" />
    </Animated.View>
  );
};

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

export default function HomeScreen() {
  const [program, setProgram] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [selectedIncompleteTasks, setSelectedIncompleteTasks] = useState<number[]>([]);
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  const [userInfo, setUserInfo] = useState({
    fullName: 'Geleceğin Şampiyonu',
    targetGoal: 'İlk 5000',
    focusArea: 'Sayısal',
    profilePic: null as string | null,
    streakDays: 0
  });

  const getDaysRemaining = () => {
    const examDate = new Date('2026-06-13T10:00:00'); // YKS 2026
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const loadTasksAndUser = () => {
    if (!store.token) return;

    // Fetch User Profile
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${store.token}`
      }
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error();
    })
    .then(data => {
      setUserInfo(prev => ({
        ...prev,
        fullName: data.fullName,
        targetGoal: data.target_goal,
        focusArea: data.focus_area,
        profilePic: data.profile_pic
      }));
    })
    .catch(() => {});

    // Fetch Stats for Streak
    fetch(`${API_BASE_URL}/api/auth/stats`, {
      headers: {
        'Authorization': `Bearer ${store.token}`
      }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.streak_days !== undefined) {
        setUserInfo(prev => ({ ...prev, streakDays: data.streak_days }));
      }
    })
    .catch(() => {});

    // Fetch Tasks
    fetch(`${API_BASE_URL}/api/tasks/`, {
      headers: {
        'Authorization': `Bearer ${store.token}`
      }
    })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Görevler yüklenemedi');
    })
    .then(data => {
      if (data && data.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const formatted = data
          .filter((ct: any) => !ct.scheduled_date || ct.scheduled_date === todayStr)
          .map((ct: any) => ({
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
    .catch(err => console.error('[Fetch Tasks Error]', err));
  };

  useFocusEffect(
    useCallback(() => {
      loadTasksAndUser();
    }, [])
  );

  const openRescheduleModal = () => {
    const incomplete = program.filter(t => t.status !== 'completed').map(t => t.id);
    setSelectedIncompleteTasks(incomplete);
    setEnergyLevel(3);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = () => {
    if (!store.token) return;

    setIsRescheduling(true);
    fetch(`${API_BASE_URL}/api/plan/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${store.token}`
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
      
      const formatted = data.scheduled_tasks.map((ct: any) => ({
        id: ct.id,
        subject: ct.subject_name,
        title: ct.title,
        timeRange: `${ct.estimated_time} dakika`,
        status: ct.status,
        color: ct.subject_name === 'MATEMATİK' ? '#3B82F6' : ct.subject_name === 'FİZİK' ? '#EF4444' : ct.subject_name === 'TÜRKÇE' ? '#8B5CF6' : '#F97316',
        bgColor: ct.subject_name === 'MATEMATİK' ? '#EFF6FF' : ct.subject_name === 'FİZİK' ? '#FEF2F2' : ct.subject_name === 'TÜRKÇE' ? '#F5F3FF' : '#FFF7ED'
      }));
      setProgram(formatted);
      Alert.alert('Başarılı', 'Planınız başarıyla güncellendi.');
    })
    .catch(err => {
      setIsRescheduling(false);
      Alert.alert('Hata', err.message || 'Plan yeniden düzenlenirken bir hata oluştu.');
    });
  };

  const completedTasks = program.filter(t => t.status === 'completed').length;
  const totalTasks = program.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  useEffect(() => {
    if (completedTasks === totalTasks && totalTasks > 0) {
      setShowCelebration(true);
    }
  }, [completedTasks, totalTasks]);

  const handleTaskPress = (item: any) => {
    if (item.status === 'active' || item.status === 'pending' || item.status === 'in_progress') {
      router.push(`/timer/${item.id}?subject=${item.subject}&duration=${item.timeRange}` as any);
    }
  };

  return (
    <LinearGradient colors={['#0B1E36', '#115E59', '#064E3B']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Modal visible={showCelebration} animationType="fade" transparent={true}>
        <View style={styles.celebrationOverlay}>
          {[...Array(30)].map((_, i) => (
            <Star key={i} delay={i * 200} />
          ))}
          <View style={styles.celebrationModal}>
            <Ionicons name="star" size={100} color="#F59E0B" style={{ marginBottom: 10 }} />
            <Text style={styles.celebrationTitle}>Tebrikler!</Text>
            <Text style={styles.celebrationText}>Günü Tamamladık</Text>
            <TouchableOpacity style={styles.celebrationButton} onPress={() => setShowCelebration(false)}>
              <Text style={styles.celebrationButtonText}>Harika!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal visible={showRescheduleModal} animationType="slide" transparent={true}>
        <View style={styles.rescheduleOverlay}>
          <View style={styles.rescheduleModal}>
            <Text style={styles.rescheduleTitle}>Planı Yeniden Düzenle 🔄</Text>
            <Text style={styles.rescheduleSubtitle}>Bugün yapamadığın görevleri ve o anki enerji seviyeni seç, senin için kalan süreyi tekrar planlayalım.</Text>
            
            <View style={styles.rescheduleFormGroup}>
              <Text style={styles.rescheduleLabel}>Mevcut Enerji Seviyen (1 - 5)</Text>
              <View style={styles.energySelector}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setEnergyLevel(level)}
                    style={[
                      styles.energyBtn,
                      energyLevel === level ? styles.energyBtnActive : styles.energyBtnInactive
                    ]}
                  >
                    <Text style={[
                      styles.energyBtnText,
                      energyLevel === level ? styles.energyBtnTextActive : styles.energyBtnTextInactive
                    ]}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.rescheduleFormGroup, { flex: 1, maxHeight: 240 }]}>
              <Text style={styles.rescheduleLabel}>Yapılamayan Görevler</Text>
              <ScrollView style={styles.rescheduleTaskList} showsVerticalScrollIndicator={true}>
                {program.filter(t => t.status !== 'completed').map((t) => {
                  const isChecked = selectedIncompleteTasks.includes(t.id);
                  return (
                    <TouchableOpacity 
                      key={t.id} 
                      onPress={() => {
                        setSelectedIncompleteTasks(prev => 
                          prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                        );
                      }}
                      style={[
                        styles.rescheduleTaskRow,
                        isChecked ? styles.rescheduleTaskRowChecked : styles.rescheduleTaskRowUnchecked
                      ]}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: t.color }}>{t.subject}</Text>
                        <Text style={styles.rescheduleTaskTitle} numberOfLines={1}>{t.title}</Text>
                      </View>
                      <View style={[
                        styles.rescheduleCheckbox,
                        isChecked ? styles.rescheduleCheckboxChecked : styles.rescheduleCheckboxUnchecked
                      ]}>
                        {isChecked && (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {program.filter(t => t.status !== 'completed').length === 0 && (
                  <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginVertical: 12 }}>Bütün görevler tamamlanmış! Yeniden planlama gerekmiyor. 🎉</Text>
                )}
              </ScrollView>
            </View>

            <View style={styles.rescheduleActions}>
              <TouchableOpacity 
                style={styles.rescheduleCancelBtn} 
                onPress={() => setShowRescheduleModal(false)}
                disabled={isRescheduling}
              >
                <Text style={styles.rescheduleCancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rescheduleConfirmBtn} 
                onPress={handleRescheduleSubmit}
                disabled={isRescheduling || program.filter(t => t.status !== 'completed').length === 0}
              >
                <Text style={styles.rescheduleConfirmBtnText}>{isRescheduling ? 'Planlanıyor...' : 'Rotayı Güncelle!'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Main Central Card */}
        <View style={styles.mainCard}>
          
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity 
                onPress={() => router.push('/profile')}
                activeOpacity={0.7}
              >
                {userInfo.profilePic ? (
                  <Image source={{ uri: userInfo.profilePic }} style={styles.profileCircle} />
                ) : (
                  <View style={styles.profileCircle}>
                    <Ionicons name="person" size={28} color="#94A3B8" />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={() => {
                  Alert.alert(
                    "Çıkış Yap",
                    "Hesabınızdan çıkmak istediğinize emin misiniz?",
                    [
                      { text: "İptal", style: "cancel" },
                      { 
                        text: "Evet", 
                        style: "destructive",
                        onPress: () => {
                          store.token = null;
                          if (router.canDismiss()) {
                            router.dismissAll();
                          }
                          router.replace('/login');
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#FFF" />
              <Text style={styles.streakText}>{userInfo.streakDays} Gün</Text>
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeText, {color: '#E2E8F0'}]}>Günaydın şampiyon,</Text>
            <Text style={[styles.nameText, {color: '#FFFFFF'}]}>{userInfo.fullName}!</Text>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.levelText}>Hedeflerine bir adım daha yakınsın 🚀</Text>
            </View>
          </View>

          {/* Daily Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.sectionTitle, {color: '#FFFFFF'}]}>Bugünün İlerlemesi</Text>
              <Text style={styles.progressText}>{completedTasks} / {totalTasks}</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              <View style={[styles.milestone, { left: '25%' }]} />
              <View style={[styles.milestone, { left: '50%' }]} />
              <View style={[styles.milestone, { left: '75%' }]} />
            </View>
          </View>

          {/* Countdown Section */}
          <View style={styles.countdownSection}>
            <View style={styles.countdownLeft}>
              <Text style={styles.countdownLabel}>YKS 2026'YA KALAN SÜRE</Text>
              <View style={styles.countdownTarget}>
                <Ionicons name="flag" size={14} color="#3498DB" />
                <Text style={styles.countdownTargetText}>Hedef: {userInfo.targetGoal}</Text>
              </View>
            </View>
            <View style={styles.countdownRight}>
              <Text style={styles.countdownBigText}>{getDaysRemaining()}</Text>
              <Text style={styles.countdownSmallText}>GÜN</Text>
            </View>
          </View>

        </View>

        {/* BIG AI RESCHEDULE BUTTON */}
        {program.filter(t => t.status !== 'completed').length > 0 && (
          <TouchableOpacity 
            style={styles.aiMagicBtnContainer}
            onPress={openRescheduleModal}
            disabled={isRescheduling}
            activeOpacity={0.8}
          >
             <LinearGradient 
                colors={['#10B981', '#059669']} 
                style={styles.aiMagicBtn}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
             >
               <Text style={styles.aiMagicIcon}>✨</Text> 
               <View style={{flexDirection: 'column', alignItems: 'flex-start', marginLeft: 12, flex: 1}}>
                  <Text style={styles.aiMagicTitle}>{isRescheduling ? 'Planlanıyor...' : 'Yapay Zeka: Planı Kurtar'}</Text>
                  <Text style={styles.aiMagicSubtitle}>Gecikmeleri telafi et, yeni rota oluştur</Text>
               </View>
             </LinearGradient>
          </TouchableOpacity>
        )}

        {/* IMAGE-EXACT: Today's Tasks Section */}
        <View style={styles.programSectionContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
            <Text style={[styles.sectionTitleLeft, { marginBottom: 0, color: '#FFFFFF' }]}>Bugünkü Görevler</Text>
          </View>
          
          <View style={styles.taskList}>
            {program.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.taskCard, 
                  (item.status === 'active' || item.status === 'in_progress') && styles.taskCardActive
                ]}
                activeOpacity={item.status !== 'completed' ? 0.7 : 1}
                onPress={() => handleTaskPress(item)}
              >
                {/* Left Icon */}
                <View style={styles.taskIconContainer}>
                  {item.status === 'completed' && (
                    <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                      <Ionicons name="checkmark-outline" size={24} color="#10B981" />
                    </View>
                  )}
                  {item.status === 'in_progress' && (
                    <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="pause" size={20} color="#D97706" style={{ marginLeft: 2 }} />
                    </View>
                  )}
                  {(item.status === 'active' || item.status === 'pending') && (
                    <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                      <Ionicons name="play" size={20} color="#0284C7" style={{ marginLeft: 2 }} />
                    </View>
                  )}
                </View>

                {/* Center Content */}
                <View style={styles.taskContent}>
                  <View style={styles.taskMetaRow}>
                    <View style={[styles.subjectBadge, { backgroundColor: item.bgColor }]}>
                      <Text style={[styles.subjectBadgeText, { color: item.color }]}>{item.subject}</Text>
                    </View>
                    {item.status === 'in_progress' ? (
                      <Text style={[styles.nowBadge, { color: '#D97706' }]}>DEVAM EDİYOR</Text>
                    ) : (
                      <Text style={styles.timeRangeText}>{item.timeRange}</Text>
                    )}
                  </View>
                  <Text style={styles.taskTitle}>{item.title}</Text>
                </View>

                {/* Right Action */}
                <View style={styles.kebabButton}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F4F7F9' 
  },
  scroll: { 
    padding: 16, 
    paddingBottom: 40,
    alignItems: 'center',
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#243B55',
    marginTop: 2,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    gap: 4,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444', 
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  progressSection: {
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#243B55',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3498DB',
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 6,
  },
  milestone: {
    position: 'absolute',
    width: 2,
    height: 16,
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
  },

  // Task List
  programSectionContainer: {
    width: '100%',
    maxWidth: 440,
    gap: 12,
  },
  sectionTitleLeft: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 4,
  },
  taskList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  taskCardActive: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    padding: 15, // offset border
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  taskIconContainer: {
    marginRight: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  subjectBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nowBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  timeRangeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
  },
  kebabButton: {
    padding: 4,
  },

  // Countdown Styles
  countdownSection: {
    backgroundColor: '#F0F9FF', 
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  countdownLeft: {
    flex: 1,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3498DB',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  countdownTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countdownTargetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  countdownRight: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  countdownBigText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#243B55',
    lineHeight: 28,
  },
  countdownSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationModal: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  celebrationTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F59E0B',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
  },
  celebrationButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  celebrationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  aiMagicBtnContainer: {
    width: '100%',
    maxWidth: 440,
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  aiMagicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  aiMagicIcon: {
    fontSize: 28,
  },
  aiMagicTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  aiMagicSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  rescheduleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  rescheduleModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  rescheduleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  rescheduleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  rescheduleFormGroup: {
    gap: 8,
  },
  rescheduleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  energySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  energyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyBtnActive: {
    backgroundColor: '#3B82F6',
  },
  energyBtnInactive: {
    backgroundColor: '#F1F5F9',
  },
  energyBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  energyBtnTextActive: {
    color: '#FFFFFF',
  },
  energyBtnTextInactive: {
    color: '#475569',
  },
  rescheduleTaskList: {
    marginTop: 4,
  },
  rescheduleTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  rescheduleTaskRowChecked: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  rescheduleTaskRowUnchecked: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  rescheduleTaskTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  rescheduleCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleCheckboxChecked: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  rescheduleCheckboxUnchecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  rescheduleActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  rescheduleCancelBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rescheduleCancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  rescheduleConfirmBtn: {
    flex: 2,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rescheduleConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  }
});
