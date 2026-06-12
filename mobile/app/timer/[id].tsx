import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { store } from '../../store';
import { API_BASE_URL } from '../../lib/config';

const parseDurationToSeconds = (durationStr: string): number => {
  if (!durationStr) return 0;
  const lowerStr = durationStr.toLowerCase();
  let minutes = 0;
  if (lowerStr.includes('sa')) {
    const hours = parseFloat(lowerStr.replace('sa', '').trim());
    if (!isNaN(hours)) minutes = hours * 60;
  } else if (lowerStr.includes('dk') || lowerStr.includes('dakika')) {
    const mins = parseFloat(lowerStr.replace('dk', '').replace('dakika', '').trim());
    if (!isNaN(mins)) minutes = mins;
  }
  return minutes * 60;
};

const formatTime = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function TimerScreen() {
  const { id, subject, duration } = useLocalSearchParams();
  const initialSeconds = parseDurationToSeconds((duration as string) || '0 Dk');
  
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true); // Auto-start
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState({
    solved: '',
    correct: '',
    wrong: ''
  });

  useEffect(() => {
    if (!isRunning && initialSeconds > 0 && timeLeft === 0) {
        setTimeLeft(initialSeconds);
    }
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const toggleTimer = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    if (!nextRunning) {
      store.inProgressTasks.add(Number(id));
    }
  };
  
  const handleFinish = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setShowStatsModal(true);
  };

  const submitFinish = async () => {
    const solved = parseInt(stats.solved) || 0;
    const correct = parseInt(stats.correct) || 0;
    const wrong = parseInt(stats.wrong) || 0;
    
    if (correct + wrong > solved) {
      Alert.alert('Hata', 'Doğru ve yanlış sayısı toplam sorudan büyük olamaz.');
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.token}`
        },
        body: JSON.stringify({ 
          status: 'completed',
          questions_solved: solved,
          questions_correct: correct,
          questions_wrong: wrong,
          actual_time: Math.floor((initialSeconds - timeLeft) / 60)
        })
      });
    } catch (err) {
      console.error("Task update failed", err);
    }

    store.completedTasks.add(Number(id));
    store.inProgressTasks.delete(Number(id));
    setShowStatsModal(false);
    router.back();
  };

  const handleExtend = () => {
    setTimeLeft(prev => prev + 300); // add 5 mins
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Stats Modal */}
      <Modal visible={showStatsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Görev Tamamlandı! 🎉</Text>
            <Text style={styles.modalSubtitle}>Kısa bir değerlendirme yapalım. Kaç soru çözdün?</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Toplam Çözülen Soru</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="Örn: 40"
                value={stats.solved}
                onChangeText={(t) => setStats({...stats, solved: t})}
              />
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Doğru</Text>
                <TextInput 
                  style={[styles.input, { borderColor: '#10B981', color: '#10B981' }]} 
                  keyboardType="numeric" 
                  placeholder="0"
                  value={stats.correct}
                  onChangeText={(t) => setStats({...stats, correct: t})}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Yanlış</Text>
                <TextInput 
                  style={[styles.input, { borderColor: '#EF4444', color: '#EF4444' }]} 
                  keyboardType="numeric" 
                  placeholder="0"
                  value={stats.wrong}
                  onChangeText={(t) => setStats({...stats, wrong: t})}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitModalButton} onPress={submitFinish}>
              <Text style={styles.submitModalButtonText}>Kaydet ve Bitir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="fire" size={24} color="#2ECC71" />
        <Text style={styles.headerTitle}>Odak Modu</Text>
      </View>

      <View style={styles.content}>
        {/* Subject Info */}
        <View style={styles.subjectContainer}>
          <Text style={styles.subjectTitle}>{(subject as string)?.toUpperCase()}</Text>
          <Text style={styles.subtitle}>Derin odaklanma zamanı. Telefonunu uzaklaştır.</Text>
        </View>

        {/* Timer Circle */}
        <View style={styles.timerWrapper}>
          <View style={styles.circleOuter}>
            <View style={styles.circleInner}>
              <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
              <Text style={styles.statusText}>KALAN SÜRE</Text>
            </View>
          </View>
        </View>

        {/* Quote Box */}
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>"Zorluklar, başarının değerini artıran süslerdir."</Text>
        </View>

        <View style={styles.bottomControls}>
          {/* Primary Complete Button */}
          <TouchableOpacity style={styles.completeButton} onPress={handleFinish} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Görevi Tamamla</Text>
          </TouchableOpacity>

          {/* Secondary Controls */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={toggleTimer} activeOpacity={0.7}>
              <Ionicons name={isRunning ? "pause" : "play"} size={20} color="#243B55" />
              <Text style={styles.secondaryButtonText}>{isRunning ? "Durdur" : "Başlat"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleExtend} activeOpacity={0.7}>
              <Ionicons name="time-outline" size={20} color="#243B55" />
              <Text style={styles.secondaryButtonText}>Uzat</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  subjectContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  timerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  circleOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 12,
    borderColor: '#3498DB',
    borderLeftColor: '#E2E8F0', // Simulated progress
    borderBottomColor: '#E2E8F0',
  },
  circleInner: {
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: '#F4F7F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 72,
    fontWeight: '800',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 4,
  },
  quoteBox: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 'auto',
  },
  quoteText: {
    fontStyle: 'italic',
    color: '#475569',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  bottomControls: {
    width: '100%',
    paddingBottom: 32,
    gap: 16,
  },
  completeButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  submitModalButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitModalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
