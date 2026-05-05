import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import { store } from '../../store';

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
  const [program, setProgram] = useState(INITIAL_PROGRAM);
  const [showCelebration, setShowCelebration] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setProgram(prev => prev.map(t => {
        if (store.completedTasks.has(t.id)) return { ...t, status: 'completed' };
        if (store.inProgressTasks.has(t.id)) return { ...t, status: 'in_progress' };
        return t;
      }));
    }, [])
  );

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
      router.push(`/timer/${item.id}?subject=${item.subject}&duration=${item.timeRange}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
                <View style={styles.profileCircle}>
                  <Ionicons name="person" size={28} color="#94A3B8" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={() => router.replace('/')}
              >
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#FFF" />
              <Text style={styles.streakText}>12 Gün</Text>
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Hoş Geldin,</Text>
            <Text style={styles.nameText}>Geleceğin Şampiyonu</Text>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.levelText}>Seviye 5 • Odak Ustası</Text>
            </View>
          </View>

          {/* Daily Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionTitle}>Bugünün İlerlemesi</Text>
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
                <Text style={styles.countdownTargetText}>Hedef: İlk 5000</Text>
              </View>
            </View>
            <View style={styles.countdownRight}>
              <Text style={styles.countdownBigText}>12</Text>
              <Text style={styles.countdownSmallText}>GÜN</Text>
            </View>
          </View>

        </View>

        {/* IMAGE-EXACT: Today's Tasks Section */}
        <View style={styles.programSectionContainer}>
          <Text style={styles.sectionTitleLeft}>Bugünkü Görevler</Text>
          
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  }
});
