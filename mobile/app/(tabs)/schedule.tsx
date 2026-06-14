import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { store } from '../../store';
import { API_BASE_URL } from '../../lib/config';

const cleanTitle = (title: string) => {
  return title ? title.replace(/\s*\((Kolay|Orta|Zor)\)/g, '') : '';
};

export default function ScheduleScreen() {
  const [groupedTasks, setGroupedTasks] = useState<any>({});
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);

  const loadTasks = () => {
    if (!store.token) return;
    fetch(`${API_BASE_URL}/api/tasks/`, {
      headers: { 'Authorization': `Bearer ${store.token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => {
      const groups: any = {};
      const todayStr = new Date().toISOString().split('T')[0];
      
      data.forEach((task: any) => {
        const date = task.scheduled_date || todayStr;
        if (!groups[date]) groups[date] = [];
        groups[date].push(task);
      });
      
      // Sort keys
      const sortedKeys = Object.keys(groups).sort();
      const sortedGroups: any = {};
      sortedKeys.forEach(k => { sortedGroups[k] = groups[k]; });
      
      setGroupedTasks(sortedGroups);
      
      // Calculate weeks (5 unique days each)
      const wks: string[][] = [];
      for (let i = 0; i < sortedKeys.length; i += 5) {
        wks.push(sortedKeys.slice(i, i + 5));
      }
      
      // Auto-expand current week containing today (or the last week)
      let currentWeekIdx = wks.findIndex(weekDates => weekDates.includes(todayStr));
      if (currentWeekIdx === -1 && wks.length > 0) {
        currentWeekIdx = wks.length - 1;
      }
      
      if (currentWeekIdx !== -1 && !expandedWeeks.includes(currentWeekIdx)) {
        setExpandedWeeks([currentWeekIdx]);
      }
      
      if (!expandedDates.includes(todayStr) && sortedGroups[todayStr]) {
        setExpandedDates([...expandedDates, todayStr]);
      }
    })
    .catch(() => {});
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const toggleWeekExpand = (index: number) => {
    if (expandedWeeks.includes(index)) {
      setExpandedWeeks(prev => prev.filter(i => i !== index));
    } else {
      setExpandedWeeks(prev => [...prev, index]);
    }
  };

  const toggleExpand = (date: string) => {
    if (expandedDates.includes(date)) {
      setExpandedDates(prev => prev.filter(d => d !== date));
    } else {
      setExpandedDates(prev => [...prev, date]);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.toDateString() === today.toDateString()) {
      const dateTasks = groupedTasks[dateStr] || [];
      const isWarmup = dateTasks.length > 0 && dateTasks.every((t: any) => t.title.includes('(Kolay)'));
      return isWarmup ? "Bugün (Isınma Turu 🔥)" : "Bugün";
    }
    if (d.toDateString() === tomorrow.toDateString()) return "Yarın";
    
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return `${d.getDate()} ${days[d.getDay()]}`;
  };

  const formatWeekRange = (weekDates: string[]) => {
    if (weekDates.length === 0) return '';
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[weekDates.length - 1]);
    
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}`;
  };

  const getWeekProgress = (weekDates: string[]) => {
    let completed = 0;
    let total = 0;
    weekDates.forEach(date => {
      const dateTasks = groupedTasks[date] || [];
      completed += dateTasks.filter((t: any) => t.status === 'completed').length;
      total += dateTasks.length;
    });
    return { completed, total };
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return '#10B981';
    if (status === 'in_progress') return '#F59E0B';
    return '#64748B';
  };

  // Group sorted unique dates into 5-day chunks
  const sortedDates = Object.keys(groupedTasks).sort();
  const weeks: string[][] = [];
  for (let i = 0; i < sortedDates.length; i += 5) {
    weeks.push(sortedDates.slice(i, i + 5));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={28} color="#005D32" />
        <Text style={styles.headerTitle}>Haftalık Programım</Text>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {weeks.map((weekDates, weekIdx) => {
          const isWeekExpanded = expandedWeeks.includes(weekIdx);
          const { completed: weekCompleted, total: weekTotal } = getWeekProgress(weekDates);
          
          return (
            <View key={weekIdx} style={styles.weekAccordionContainer}>
              <TouchableOpacity 
                style={styles.weekHeader} 
                onPress={() => toggleWeekExpand(weekIdx)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.weekTitleRow}>
                    <Text style={styles.weekTitle}>{weekIdx + 1}. Hafta</Text>
                    <View style={styles.weekBadge}>
                      <Text style={styles.weekBadgeText}>{weekCompleted}/{weekTotal} Görev</Text>
                    </View>
                  </View>
                  <Text style={styles.weekSubtitle}>{formatWeekRange(weekDates)}</Text>
                </View>
                <Ionicons name={isWeekExpanded ? "chevron-up" : "chevron-down"} size={22} color="#1B2A1C" />
              </TouchableOpacity>
              
              {isWeekExpanded && (
                <View style={styles.weekBody}>
                  {weekDates.map((date) => {
                    const isExpanded = expandedDates.includes(date);
                    const tasks = groupedTasks[date] || [];
                    const completedCount = tasks.filter((t: any) => t.status === 'completed').length;
                    
                    return (
                      <View key={date} style={styles.accordionContainer}>
                        <TouchableOpacity 
                          style={styles.accordionHeader} 
                          onPress={() => toggleExpand(date)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.accordionTitleRow}>
                            <Text style={styles.dateText}>{formatDate(date)}</Text>
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{completedCount}/{tasks.length}</Text>
                            </View>
                          </View>
                          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#6C7E6E" />
                        </TouchableOpacity>
                        
                        {isExpanded && (
                          <View style={styles.accordionBody}>
                            {tasks.map((task: any) => (
                              <View key={task.id} style={styles.taskRow}>
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
                                <View style={styles.taskInfo}>
                                  <Text style={styles.taskSubject}>{task.subject_name}</Text>
                                  <Text style={styles.taskTitle}>{cleanTitle(task.title)}</Text>
                                </View>
                                <Text style={styles.taskTime}>{task.estimated_time} dk</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
        {weeks.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748B', marginTop: 12 }}>Henüz program oluşturulmadı.</Text>
            <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Ana ekrandan planınızı başlatabilirsiniz.</Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D5DDD6',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B2A1C',
  },
  scroll: {
    padding: 16,
  },
  weekAccordionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D5DDD6',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: '#F3F6F4',
    borderBottomWidth: 1,
    borderBottomColor: '#D5DDD6',
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B2A1C',
  },
  weekBadge: {
    backgroundColor: '#EBF5EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  weekBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#005D32',
  },
  weekSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C7E6E',
  },
  weekBody: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  accordionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2A1C',
  },
  badge: {
    backgroundColor: '#F3F6F4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C7E6E',
  },
  accordionBody: {
    padding: 14,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F6F4',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6F4',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  taskInfo: {
    flex: 1,
  },
  taskSubject: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6C7E6E',
    marginBottom: 2,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B2A1C',
  },
  taskTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6C7E6E',
  }
});
