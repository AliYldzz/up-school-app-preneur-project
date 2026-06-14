import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { store } from '../store';
import { API_BASE_URL } from '../lib/config';

const SettingItem = ({ icon, label, description, type = 'chevron', value = false, onValueChange = () => {} }: { icon: any, label: string, description?: string, type?: string, value?: boolean, onValueChange?: (val: boolean) => void }) => (
  <TouchableOpacity style={styles.item} disabled={type === 'switch'}>
    <View style={styles.itemIcon}>
      <Ionicons name={icon} size={22} color="#1B2A1C" />
    </View>
    <View style={styles.itemContent}>
      <Text style={styles.itemLabel}>{label}</Text>
      {description && <Text style={styles.itemDescription}>{description}</Text>}
    </View>
    {type === 'chevron' && <Ionicons name="chevron-forward" size={20} color="#6C7E6E" />}
    {type === 'switch' && (
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: '#D5DDD6', true: '#2ECC71' }}
        thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : value ? '#FFFFFF' : '#F3F6F4'}
      />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleAccountDelete = () => {
    Alert.alert(
      "Emin misiniz?",
      "Hesabınızı silerseniz, tüm görevleriniz, hata kumbaranız ve gelişiminiz tamamen silinecek. Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: () => {
            fetch(`${API_BASE_URL}/api/auth/me`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${store.token}` }
            })
            .then(() => {
              store.token = null;
              router.replace('/');
            })
            .catch(err => {
              Alert.alert('Hata', 'Hesap silinirken bir hata oluştu.');
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1B2A1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <View style={styles.sectionCard}>
            <SettingItem icon="person-outline" label="Profil Bilgileri" description="İsim, okul ve hedef güncelle" />
            <SettingItem icon="mail-outline" label="E-posta" description="mert.yilmaz@example.com" />
            <SettingItem icon="lock-closed-outline" label="Şifre Değiştir" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uygulama</Text>
          <View style={styles.sectionCard}>
            <SettingItem 
              icon="notifications-outline" 
              label="Bildirimler" 
              type="switch" 
              value={notifications} 
              onValueChange={setNotifications} 
            />
            <SettingItem 
              icon="moon-outline" 
              label="Koyu Mod" 
              type="switch" 
              value={darkMode} 
              onValueChange={setDarkMode} 
            />
            <SettingItem icon="globe-outline" label="Dil" description="Türkçe" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek</Text>
          <View style={styles.sectionCard}>
            <SettingItem icon="help-circle-outline" label="Yardım Merkezi" />
            <SettingItem icon="chatbubble-outline" label="Geri Bildirim" />
            <SettingItem icon="information-circle-outline" label="Hakkında" description="v1.2.0" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tehlikeli Bölge</Text>
          <View style={[styles.sectionCard, { borderColor: '#FEE2E2' }]}>
            <TouchableOpacity style={styles.item} onPress={handleAccountDelete}>
              <View style={[styles.itemIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemLabel, { color: '#EF4444' }]}>Hesabımı Kalıcı Olarak Sil</Text>
                <Text style={styles.itemDescription}>Tüm verilerin geri döndürülemez şekilde silinir.</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={() => {
            store.token = null;
            router.replace('/');
        }}>
          <Text style={styles.logoutText}>Oturumu Kapat</Text>
        </TouchableOpacity>
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D5DDD6',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B2A1C',
  },
  scroll: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C7E6E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6F4',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F6F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B2A1C',
  },
  itemDescription: {
    fontSize: 12,
    color: '#6C7E6E',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 8,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});
