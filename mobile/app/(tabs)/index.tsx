import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Dimensions, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { store } from '../../store';
import { supabase } from '../../lib/supabaseClient';
import { rescheduleStudyPlan } from '../../lib/aiService';

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

const cleanTitle = (title: string) => {
  return title ? title.replace(/\s*\((Kolay|Orta|Zor)\)/g, '') : '';
};

export default function HomeScreen() {
  const [program, setProgram] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [selectedIncompleteTasks, setSelectedIncompleteTasks] = useState<number[]>([]);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [consecutiveLowEnergyCount, setConsecutiveLowEnergyCount] = useState(0);
  
  const [userInfo, setUserInfo] = useState({
    fullName: 'Geleceğin Şampiyonu',
    targetGoal: 'İlk 5000',
    focusArea: 'Sayısal',
    profilePic: null as string | null,
    streakDays: 0,
    examDate: null as string | null,
  });

  const getDaysRemaining = () => {
    let targetDateStr = userInfo.examDate;
    if (!targetDateStr) {
      const today = new Date();
      const exam2026 = new Date('2026-06-13T10:00:00');
      if (today > exam2026) {
        targetDateStr = '2027-06-19T10:00:00'; // YKS 2027
      } else {
        targetDateStr = '2026-06-13T10:00:00'; // YKS 2026
      }
    }
    const examDate = new Date(targetDateStr);
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getExamYear = () => {
    if (userInfo.examDate) {
      return new Date(userInfo.examDate).getFullYear();
    }
    const today = new Date();
    const exam2026 = new Date('2026-06-13T10:00:00');
    return today > exam2026 ? 2027 : 2026;
  };

  const getSubjectColor = (subject: string) => {
    const map: Record<string, { color: string; bgColor: string }> = {
      'MATEMATİK': { color: '#2E86C1', bgColor: '#EBF5FB' },
      'FİZİK':     { color: '#E74C3C', bgColor: '#FDEDEC' },
      'KİMYA':     { color: '#27AE60', bgColor: '#EAFAF1' },
      'BİYOLOJİ':  { color: '#8E44AD', bgColor: '#F4ECF7' },
      'TÜRKÇE':    { color: '#9B59B6', bgColor: '#F5EEF8' },
      'EDEBİYAT':  { color: '#C0392B', bgColor: '#FDEDEC' },
      'TARİH':     { color: '#D4AC0D', bgColor: '#FEFCE8' },
      'COĞRAFYA':  { color: '#1ABC9C', bgColor: '#E8F8F5' },
    };
    return map[subject] || { color: '#E67E22', bgColor: '#FDF2E9' };
  };

  const formatTask = (ct: any) => {
    const { color, bgColor } = getSubjectColor(ct.subject_name);
    return {
      id: ct.id,
      subject: ct.subject_name,
      title: ct.title,
      timeRange: `${ct.estimated_time} dakika`,
      status: ct.status,
      color,
      bgColor,
      estimated_time: ct.estimated_time,
      priority_score: ct.priority_score,
    };
  };

  const loadTasksAndUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load user profile
    const { data: profile } = await supabase
      .from('users')
      .select('fullName, target_goal, focus_area, profile_pic')
      .eq('id', user.id)
      .single();

    let computedStreakDays = 0;
    try {
      // Calculate streak client-side
      const { data: completedTasksData } = await supabase
        .from('tasks')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('is_deleted', false);

      if (completedTasksData && completedTasksData.length > 0) {
        const activeDays = new Set<string>();
        completedTasksData.forEach(t => {
          if (t.created_at) {
            const dateStr = new Date(t.created_at).toISOString().split('T')[0];
            activeDays.add(dateStr);
          }
        });

        const checkDate = new Date();
        let checkDateStr = checkDate.toISOString().split('T')[0];
        if (!activeDays.has(checkDateStr)) {
          checkDate.setDate(checkDate.getDate() - 1);
          checkDateStr = checkDate.toISOString().split('T')[0];
        }

        while (activeDays.has(checkDateStr)) {
          computedStreakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
          checkDateStr = checkDate.toISOString().split('T')[0];
        }
      }
    } catch (err) {
      console.warn('Error computing streak:', err);
    }

    if (profile) {
      store.userProfile = profile;
      setUserInfo(prev => ({
        ...prev,
        fullName: profile.fullName || 'Geleceğin Şampiyonu',
        targetGoal: profile.target_goal || 'İlk 5000',
        focusArea: profile.focus_area || 'Sayısal',
        profilePic: profile.profile_pic || null,
        examDate: null,
        streakDays: computedStreakDays,
      }));
    }

    // Load today's tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheduled_date', todayStr)
      .order('priority_score', { ascending: false });

    if (error) {
      console.error('[Supabase Tasks Error]', error);
      return;
    }

    if (tasks && tasks.length > 0) {
      setProgram(tasks.map(formatTask));
    }
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
    const performReschedule = async () => {
      setIsRescheduling(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Oturum bulunamadı.');

        const profile = store.userProfile;
        const daysRemaining = getDaysRemaining();
        const incompleteTasks = program.filter(t => selectedIncompleteTasks.includes(t.id));
        const otherTasks = program.filter(t => !selectedIncompleteTasks.includes(t.id) && t.status !== 'completed');

        const rescheduled = await rescheduleStudyPlan(
          daysRemaining,
          profile?.target_goal || 'İlk 5000',
          profile?.focus_area || 'Sayısal',
          energyLevel,
          incompleteTasks,
          otherTasks
        );

        // Write rescheduled tasks back to Supabase
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Client-side safety filter: deduplicate rescheduled tasks by task ID
        const uniqueRescheduled: any[] = [];
        const seenIds = new Set();
        for (const t of rescheduled) {
          if (!t || !t.id) continue;
          if (!seenIds.has(t.id)) {
            seenIds.add(t.id);
            uniqueRescheduled.push(t);
          }
        }

        for (const t of uniqueRescheduled) {
          const schedDate = new Date();
          schedDate.setDate(schedDate.getDate() + (t.day_offset || 0));
          const dateStr = schedDate.toISOString().split('T')[0];
          await supabase
            .from('tasks')
            .update({
              scheduled_date: dateStr,
              priority_score: t.priority_score,
              estimated_time: t.estimated_time,
              status: t.day_offset === 0 ? 'pending' : 'pending'
            })
            .eq('id', t.id)
            .eq('user_id', user.id);
        }

        setIsRescheduling(false);
        setShowRescheduleModal(false);
        Alert.alert('Başarılı ✨', 'Yapay zeka planınızı güncelledi!');
        await loadTasksAndUser();
      } catch (err: any) {
        setIsRescheduling(false);
        Alert.alert('Hata', err.message || 'Plan yeniden düzenlenirken bir hata oluştu.');
      }
    };

    if (energyLevel <= 2) {
      const nextCount = consecutiveLowEnergyCount + 1;
      setConsecutiveLowEnergyCount(nextCount);
      if (nextCount >= 3) {
        Alert.alert(
          "Meydan Okuma Zamanı! 🎯",
          "Üst üste 3 kez düşük enerji seviyesi seçtin. Unutma, YKS sürecinde disiplin ve süreklilik şampiyonları belirler! Biraz gayret edip bugün kendine meydan okumaya ne dersin? Yeni rotayı yine de oluşturmak istiyor musun?",
          [
            {
              text: "Vazgeç, Devam Edeceğim",
              onPress: () => {},
              style: "cancel"
            },
            {
              text: "Evet, Planı Güncelle",
              onPress: performReschedule
            }
          ]
        );
        return;
      }
    } else {
      setConsecutiveLowEnergyCount(0);
    }

    performReschedule();
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
    <LinearGradient colors={['#EBF0EC', '#CBE0D1']} style={styles.container}>
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
                    onPress={() => {
                      setEnergyLevel(level);
                      if (level >= 3) {
                        setConsecutiveLowEnergyCount(0);
                      }
                    }}
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
                        <Text style={styles.rescheduleTaskTitle} numberOfLines={1}>{cleanTitle(t.title)}</Text>
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
                        onPress: async () => {
                          await supabase.auth.signOut();
                          store.token = null;
                          store.user = null;
                          store.userProfile = null;
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
            <Text style={[styles.welcomeText, {color: '#EBF0EC'}]}>YKS {getExamYear()} SERÜVENİ</Text>
            <Text style={[styles.nameText, {color: '#FFFFFF'}]}>Tekrar hoş geldin, {userInfo.fullName.split(' ')[0]}!</Text>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.levelText}>Bugün hedeflerine ulaşmak için harika bir gün. Odaklan ve başla! 🚀</Text>
            </View>
          </View>

          {/* Daily Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.sectionTitle, {color: '#FFFFFF'}]}>Bugünün İlerlemesi</Text>
              <Text style={[styles.progressText, {color: '#2ECC71'}]}>{completedTasks} / {totalTasks}</Text>
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
              <Text style={styles.countdownLabel}>YKS {getExamYear()}'YE KALAN SÜRE</Text>
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
                colors={['#005D32', '#004222']} 
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
            <Text style={[styles.sectionTitleLeft, { marginBottom: 0, color: '#1B2A1C' }]}>
              {program.length > 0 && program.every(t => t.title.includes('(Kolay)')) 
                ? 'Bugünkü Görevler (Isınma Turu 🔥)' 
                : 'Bugünkü Görevler'}
            </Text>
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
                    <View style={[styles.iconCircle, { backgroundColor: '#EBF5EC' }]}>
                      <Ionicons name="checkmark-outline" size={24} color="#2ECC71" />
                    </View>
                  )}
                  {item.status === 'in_progress' && (
                    <View style={[styles.iconCircle, { backgroundColor: '#FDEDEC' }]}>
                      <Ionicons name="pause" size={20} color="#E74C3C" style={{ marginLeft: 2 }} />
                    </View>
                  )}
                  {(item.status === 'active' || item.status === 'pending') && (
                    <View style={[styles.iconCircle, { backgroundColor: '#EBF5EC' }]}>
                      <Ionicons name="play" size={20} color="#005D32" style={{ marginLeft: 2 }} />
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
                  <Text style={styles.taskTitle}>{cleanTitle(item.title)}</Text>
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
    backgroundColor: '#EBF0EC' 
  },
  scroll: { 
    padding: 16, 
    paddingBottom: 40,
    alignItems: 'center',
  },
  mainCard: {
    backgroundColor: '#1B2A1C',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1.5,
    borderColor: '#005D32',
    gap: 16,
    marginBottom: 24,
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D5DDD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  welcomeContainer: {
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2ECC71',
    letterSpacing: 1,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 6,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 2,
    gap: 6,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EBF0EC',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#005D32', 
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 4,
    borderWidth: 1,
    borderColor: '#2ECC71',
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
    color: '#1B2A1C',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2ECC71',
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
    color: '#1B2A1C',
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
    borderColor: '#D5DDD6',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  taskCardActive: {
    borderColor: '#005D32',
    borderWidth: 2,
    padding: 15, // offset border
    shadowColor: '#005D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
    color: '#005D32',
    letterSpacing: 0.5,
  },
  timeRangeText: {
    fontSize: 11,
    color: '#6C7E6E',
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B2A1C',
    lineHeight: 18,
  },
  kebabButton: {
    padding: 4,
  },

  // Countdown Styles
  countdownSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)', 
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  countdownLeft: {
    flex: 1,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2ECC71',
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
    color: '#EBF0EC',
  },
  countdownRight: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  countdownBigText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B2A1C',
    lineHeight: 28,
  },
  countdownSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6C7E6E',
    letterSpacing: 1,
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 42, 28, 0.85)',
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
    backgroundColor: '#005D32',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: '#005D32',
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
    shadowColor: '#005D32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
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
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  rescheduleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 42, 28, 0.6)',
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
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  rescheduleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B2A1C',
  },
  rescheduleSubtitle: {
    fontSize: 12,
    color: '#6C7E6E',
    lineHeight: 16,
  },
  rescheduleFormGroup: {
    gap: 8,
  },
  rescheduleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5D4C',
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
    backgroundColor: '#005D32',
  },
  energyBtnInactive: {
    backgroundColor: '#F3F6F4',
  },
  energyBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  energyBtnTextActive: {
    color: '#FFFFFF',
  },
  energyBtnTextInactive: {
    color: '#6C7E6E',
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
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  rescheduleTaskRowUnchecked: {
    borderColor: '#D5DDD6',
    backgroundColor: '#FFFFFF',
  },
  rescheduleTaskTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B2A1C',
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
    backgroundColor: '#005D32',
    borderColor: '#005D32',
  },
  rescheduleCheckboxUnchecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D5DDD6',
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
    borderColor: '#D5DDD6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rescheduleCancelBtnText: {
    color: '#6C7E6E',
    fontSize: 14,
    fontWeight: '700',
  },
  rescheduleConfirmBtn: {
    flex: 2,
    backgroundColor: '#005D32',
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
