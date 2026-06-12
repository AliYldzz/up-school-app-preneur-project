import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { store } from '../../store';
import { API_BASE_URL } from '../../lib/config';

export default function ScheduleScreen() {
  const [groupedTasks, setGroupedTasks] = useState<any>({});
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

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
    
    if (d.toDateString() === today.toDateString()) return "Bugün";
    if (d.toDateString() === tomorrow.toDateString()) return "Yarın";
    
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return `${d.getDate()} ${days[d.getDay()]}`;
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return '#10B981';
    if (status === 'in_progress') return '#F59E0B';
    return '#64748B';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar" size={28} color="#3B82F6" />
        <Text style={styles.headerTitle}>Haftalık Programım</Text>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {Object.keys(groupedTasks).map((date) => {
          const isExpanded = expandedDates.includes(date);
          const tasks = groupedTasks[date];
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
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.accordionBody}>
                  {tasks.map((task: any) => (
                    <View key={task.id} style={styles.taskRow}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskSubject}>{task.subject_name}</Text>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                      </View>
                      <Text style={styles.taskTime}>{task.estimated_time} dk</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  scroll: {
    padding: 16,
  },
  accordionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  accordionBody: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskSubject: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  taskTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  }
});
