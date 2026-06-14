import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, AppState, AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { store } from '../../store';
import { API_BASE_URL } from '../../lib/config';
import { addToOfflineQueue, syncOfflineQueue, TaskPayload } from '../../lib/offlineQueue';

interface Task {
  id: number;
  title: string;
  subject_name: string;
  estimated_time: number;
  status: string;
}

const cleanTitle = (title: string) => {
  return title ? title.replace(/\s*\((Kolay|Orta|Zor)\)/g, '') : '';
};

export default function FocusScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(0); // Saniye cinsinden
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const appState = useRef(AppState.currentState);
  const lastActiveTime = useRef(Date.now());

  useEffect(() => {
    fetchTasks();
    syncOfflineQueue(); // Ekrana girildiğinde offline kuyruğu senkronize etmeyi dene

    // Arka plana atılma (Background) takibi
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Uygulama tekrar ön plana geldi
        syncOfflineQueue();
        
        // Eğer sayaç aktiftiyse geçen süreyi hesapla ve düş
        if (isActive && selectedTask && !isCompleted) {
          const now = Date.now();
          const timeElapsed = Math.floor((now - lastActiveTime.current) / 1000);
          setTimeLeft(prev => Math.max(0, prev - timeElapsed));
        }
      } else if (nextAppState === 'background') {
        // Arka plana gitti
        lastActiveTime.current = Date.now();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleTaskFinish();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const fetchTasks = async () => {
    if (!store.token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/`, {
        headers: { Authorization: `Bearer ${store.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.filter((t: Task) => t.status === 'pending'));
      }
    } catch (err) {
      console.log('Görevler çekilemedi, internet yok olabilir.');
    }
  };

  const startTask = (task: Task) => {
    setSelectedTask(task);
    setTimeLeft(task.estimated_time * 60);
    setIsActive(false);
    setIsCompleted(false);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const handleTaskFinish = () => {
    setIsCompleted(true);
    setIsActive(false);
  };

  const extendTime = (minutes: number) => {
    setTimeLeft(prev => prev + (minutes * 60));
    setIsCompleted(false);
    setIsActive(true);
  };

  const completeTask = async () => {
    if (!selectedTask) return;

    // Lokal kuyruğa ekle
    const payload: TaskPayload = {
      title: selectedTask.title, // Eşleşme için
      status: 'completed',
      actual_time: selectedTask.estimated_time - Math.floor(timeLeft / 60),
      version: 2 // Versiyon yükseltildi
    };

    await addToOfflineQueue(payload);
    
    // Senkronizasyonu dene
    await syncOfflineQueue();
    
    // UI Güncelle
    setSelectedTask(null);
    setIsCompleted(false);
    fetchTasks();
  };

  // Zaman Formatlayıcı (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- UI RENDER --- //

  if (selectedTask) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.timerHeader}>
          <TouchableOpacity onPress={() => setSelectedTask(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1B2A1C" />
          </TouchableOpacity>
          <Text style={styles.timerHeaderTitle}>Odak Modu</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.timerContent}>
          <View style={styles.taskCard}>
            <Text style={styles.taskSubject}>{selectedTask.subject_name}</Text>
            <Text style={styles.taskTitle}>{cleanTitle(selectedTask.title)}</Text>
          </View>

          <View style={styles.circleContainer}>
            <View style={[styles.timerCircle, isActive && styles.timerCircleActive, isCompleted && styles.timerCircleDone]}>
              <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
            </View>
          </View>

          {!isCompleted ? (
            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.controlBtn} onPress={toggleTimer}>
                <Ionicons name={isActive ? "pause" : "play"} size={32} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#F3F6F4', borderWidth: 1, borderColor: '#D5DDD6' }]} onPress={() => setTimeLeft(0)}>
                <Ionicons name="stop" size={24} color="#1B2A1C" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.finishedContainer}>
              <Text style={styles.finishedText}>Tebrikler, süre doldu! 🎉</Text>
              
              <TouchableOpacity style={styles.primaryBtn} onPress={completeTask}>
                <Text style={styles.primaryBtnText}>Görevi Tamamla & Senkronize Et</Text>
              </TouchableOpacity>

              <Text style={styles.orText}>- veya -</Text>

              <View style={styles.extendRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => extendTime(5)}>
                  <Text style={styles.secondaryBtnText}>+5 Dk Uzat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => extendTime(15)}>
                  <Text style={styles.secondaryBtnText}>+15 Dk Uzat</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Neye Odaklanıyoruz?</Text>
      <Text style={styles.subtitle}>İnternet olmasa da verileriniz cihazda güvendedir.</Text>
      
      <ScrollView contentContainerStyle={styles.taskList}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>Bugünlük bekleyen göreviniz yok!</Text>
          </View>
        ) : (
          tasks.map(task => (
            <TouchableOpacity key={task.id} style={styles.taskItem} onPress={() => startTask(task)}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskBadge}>{task.subject_name}</Text>
                <Text style={styles.taskName}>{cleanTitle(task.title)}</Text>
              </View>
              <View style={styles.taskTime}>
                <Ionicons name="time-outline" size={16} color="#6C7E6E" />
                <Text style={styles.taskTimeText}>{task.estimated_time} dk</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF0EC',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B2A1C',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#6C7E6E',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  taskList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  taskInfo: {
    flex: 1,
  },
  taskBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005D32',
    backgroundColor: '#EBF5EC',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B2A1C',
  },
  taskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F6F4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  taskTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C7E6E',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C7E6E',
    fontWeight: '500',
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  timerHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B2A1C',
  },
  timerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  taskSubject: {
    fontSize: 14,
    fontWeight: '800',
    color: '#005D32',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B2A1C',
    textAlign: 'center',
  },
  circleContainer: {
    marginVertical: 60,
  },
  timerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 8,
    borderColor: '#D5DDD6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.01,
    shadowRadius: 20,
    elevation: 2,
  },
  timerCircleActive: {
    borderColor: '#005D32',
  },
  timerCircleDone: {
    borderColor: '#2ECC71',
  },
  timeText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#1B2A1C',
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  controlBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#005D32',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#005D32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  finishedContainer: {
    width: '100%',
    alignItems: 'center',
  },
  finishedText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#005D32',
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#005D32',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#005D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    marginVertical: 16,
    color: '#6C7E6E',
    fontWeight: '600',
  },
  extendRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  secondaryBtnText: {
    color: '#1B2A1C',
    fontSize: 14,
    fontWeight: '700',
  },
});
