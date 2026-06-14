import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { store } from '../../store';
import { supabase } from '../../lib/supabaseClient';

const { width } = Dimensions.get('window');

const StatCard = ({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function ProfileScreen() {
  const [userInfo, setUserInfo] = useState({
    fullName: 'Geleceğin Şampiyonu',
    targetGoal: 'İlk 5000',
    focusArea: 'Sayısal',
    profilePic: null as string | null
  });

  const [stats, setStats] = useState({
    total_solved: 0,
    total_hours: 0,
    streak_days: 0,
    accuracy_rate: 0,
    total_correct: 0,
    total_wrong: 0,
    subject_accuracy: [] as any[],
    daily_chart: [] as number[]
  });

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load profile
    const { data: profile } = await supabase
      .from('users')
      .select('fullName, target_goal, focus_area, profile_pic')
      .eq('id', user.id)
      .single();

    if (profile) {
      store.userProfile = profile;
      setUserInfo({
        fullName: profile.fullName || 'Geleceğin Şampiyonu',
        targetGoal: profile.target_goal || 'İlk 5000',
        focusArea: profile.focus_area || 'Sayısal',
        profilePic: profile.profile_pic || null
      });
    }

    // Compute stats from tasks table
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, estimated_time, subject_name, created_at')
      .eq('user_id', user.id);

    if (tasks) {
      const completed = tasks.filter(t => t.status === 'completed');
      const totalHours = Math.round(completed.reduce((sum, t) => sum + (t.estimated_time || 0), 0) / 60);

      // Subject accuracy (simplified: completed/total per subject)
      const subjectMap: Record<string, { total: number; done: number }> = {};
      tasks.forEach(t => {
        if (!subjectMap[t.subject_name]) subjectMap[t.subject_name] = { total: 0, done: 0 };
        subjectMap[t.subject_name].total++;
        if (t.status === 'completed') subjectMap[t.subject_name].done++;
      });
      const subjectAccuracy = Object.entries(subjectMap).map(([name, v]) => ({
        name,
        percent: Math.round((v.done / v.total) * 100)
      }));

      // Calculate streak client-side
      let computedStreakDays = 0;
      const activeDays = new Set<string>();
      completed.forEach(t => {
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

      setStats(prev => ({
        ...prev,
        total_solved: completed.length,
        total_hours: totalHours,
        streak_days: computedStreakDays,
        subject_accuracy: subjectAccuracy,
      }));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setUserInfo(prev => ({ ...prev, profilePic: base64Image }));

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ profile_pic: base64Image })
          .eq('id', user.id);
        if (error) {
          Alert.alert('Hata', 'Profil fotoğrafı güncellenemedi.');
        }
      }
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#CBE0D1', '#B2C7B8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              {userInfo.profilePic ? (
                <Image source={{ uri: userInfo.profilePic }} style={{ width: 100, height: 100, borderRadius: 50 }} />
              ) : (
                <Ionicons name="person" size={50} color="#94A3B8" />
              )}
            </View>
            <TouchableOpacity style={styles.editButton} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userInfo.fullName}</Text>
          <View style={styles.badge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.badgeText}>Seviye 5 • Odak Ustası</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatCard 
          icon="time" 
          label="Çalışma Süresi" 
          value={`${stats.total_hours}s`} 
          color="#3B82F6" 
        />
        <StatCard 
          icon="checkmark-circle" 
          label="Çözülen Soru" 
          value={`${stats.total_solved}`} 
          color="#10B981" 
        />
        <StatCard 
          icon="trending-up" 
          label="Verimlilik" 
          value={`%${stats.accuracy_rate}`} 
          color="#8B5CF6" 
        />
        <StatCard 
          icon="analytics" 
          label="Doğru-Yanlış" 
          value={`${stats.total_correct} D - ${stats.total_wrong} Y`} 
          color="#EF4444" 
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>İstatistikler</Text>
        <View style={styles.chartContainer}>
          {stats.daily_chart && stats.daily_chart.length > 0 ? (
            <View style={styles.chartBars}>
              {stats.daily_chart.map((val, idx) => (
                <View key={idx} style={styles.barWrapper}>
                  <View style={[styles.barFill, { height: `${Math.max(val, 5)}%` }]} />
                </View>
              ))}
            </View>
          ) : (
            <LinearGradient
              colors={['#FFFFFF', '#F3F6F4']}
              style={styles.chartInner}
            >
              <Ionicons name="stats-chart" size={40} color="#6C7E6E" />
              <Text style={styles.placeholderText}>Henüz veri yok</Text>
            </LinearGradient>
          )}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D5DDD6', marginHorizontal: 16, borderRadius: 24, padding: 20 }]}>
        <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Ders Bazlı Başarı</Text>
        
        {stats.subject_accuracy && stats.subject_accuracy.length > 0 ? stats.subject_accuracy.map((item, i) => (
          <View key={i} style={styles.subjectRow}>
            <View style={styles.subjectMeta}>
              <Text style={styles.subjectName}>{item.name}</Text>
              <Text style={styles.subjectPercent}>{item.percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${item.percent}%` }]} />
            </View>
          </View>
        )) : (
          <Text style={{ textAlign: 'center', color: '#64748B', marginVertical: 12 }}>Henüz yeterli veri yok.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ayarlar</Text>
        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="notifications" size={20} color="#0284C7" />
          </View>
          <Text style={styles.menuText}>Bildirim Ayarları</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Bilgi', 'Ayarlar sayfası yakında eklenecektir.')}>
          <View style={[styles.menuIcon, { backgroundColor: '#F0F9FF' }]}>
            <Ionicons name="settings" size={20} color="#0369A1" />
          </View>
          <Text style={styles.menuText}>Ayarlar</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            Alert.alert(
              "Çıkış Yap",
              "Hesabınızdan çıkmak istediğinize emin misiniz?",
              [
                { text: "İptal", style: "cancel" },
                { 
                  text: "Evet, Çıkış Yap", 
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
          <View style={[styles.menuIcon, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="log-out" size={20} color="#EF4444" />
          </View>
          <Text style={[styles.menuText, { color: '#EF4444' }]}>Çıkış Yap</Text>
          <Ionicons name="chevron-forward" size={20} color="#EF4444" opacity={0.5} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF0EC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(27,42,28,0.1)',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#005D32',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B2A1C',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27,42,28,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2A1C',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
    marginTop: -20,
  },
  statCard: {
    backgroundColor: '#FFF',
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5DDD6',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B2A1C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C7E6E',
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B2A1C',
    marginBottom: 16,
  },
  chartContainer: {
    height: 180,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  barWrapper: {
    width: 24,
    height: '100%',
    backgroundColor: '#F3F6F4',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#005D32',
    borderRadius: 12,
  },
  chartInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C7E6E',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D5DDD6',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 5,
    elevation: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2A1C',
  },
  subjectRow: {
    marginBottom: 16,
  },
  subjectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A5D4C',
  },
  subjectPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#005D32',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#EBF0EC',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 4,
  },
});
