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
import { API_BASE_URL } from '../../lib/config';

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
    subject_accuracy: [] as any[],
    daily_chart: [] as number[]
  });

  const loadUserData = () => {
    if (!store.token) return;
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
      setUserInfo({
        fullName: data.fullName,
        targetGoal: data.target_goal,
        focusArea: data.focus_area,
        profilePic: data.profile_pic
      });
    })
    .catch(() => {});

    // Fetch Stats
    fetch(`${API_BASE_URL}/api/auth/stats`, {
      headers: {
        'Authorization': `Bearer ${store.token}`
      }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) {
        setStats({
          total_solved: data.total_solved || 0,
          total_hours: data.total_hours || 0,
          streak_days: data.streak_days || 0,
          accuracy_rate: data.accuracy_rate || 0,
          subject_accuracy: data.subject_accuracy || [],
          daily_chart: data.daily_chart || []
        });
      }
    })
    .catch(() => {});
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

      // Kaydet API Call
      fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.token}`
        },
        body: JSON.stringify({ profile_pic: base64Image })
      }).catch(() => {
        Alert.alert('Hata', 'Profil fotoğrafı güncellenemedi.');
      });
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#10B981', '#3B82F6']}
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
          label="Tamamlanan" 
          value={`${stats.total_solved}`} 
          color="#10B981" 
        />
        <StatCard 
          icon="flame" 
          label="Seri" 
          value={`${stats.streak_days} Gün`} 
          color="#EF4444" 
        />
        <StatCard 
          icon="trending-up" 
          label="Verimlilik" 
          value={`%${stats.accuracy_rate}`} 
          color="#8B5CF6" 
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
              colors={['#F8FAFC', '#F1F5F9']}
              style={styles.chartInner}
            >
              <Ionicons name="stats-chart" size={40} color="#CBD5E1" />
              <Text style={styles.placeholderText}>Henüz veri yok</Text>
            </LinearGradient>
          )}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: '#F0FDF4', marginHorizontal: 16, borderRadius: 24, padding: 20 }]}>
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
    backgroundColor: '#F4F7F9',
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
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
    color: '#FFF',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
  },
  chartContainer: {
    height: 180,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#3B82F6',
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
    color: '#94A3B8',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
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
    color: '#334155',
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
    color: '#475569',
  },
  subjectPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B82F6',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
});
