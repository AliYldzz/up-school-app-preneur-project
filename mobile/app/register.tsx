import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../lib/config';
import { store } from '../store';

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    focus_area: '',
    weekly_hours: '',
    weak_subjects: [] as string[],
    fullName: '',
    email: '',
    password: '',
    profile_pic: null as string | null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  const handleNext = () => {
    if (step === 1 && (!formData.fullName || !formData.email || !formData.password)) {
      Alert.alert('Eksik Bilgi', 'Lütfen Ad Soyad, E-posta ve Şifre alanlarını doldurun.');
      return;
    }
    if (step === 2 && !formData.focus_area) {
      Alert.alert('Eksik Seçim', 'Lütfen bir alan seçin.');
      return;
    }
    if (step === 3 && !formData.weekly_hours) {
      Alert.alert('Eksik Seçim', 'Lütfen çalışma temponuzu seçin.');
      return;
    }
    if (step === 4 && formData.weak_subjects.length === 0) {
      Alert.alert('Eksik Seçim', 'Lütfen en zorlandığınız ders(ler)i seçin.');
      return;
    }
    setStep(step + 1);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setFormData({ ...formData, profile_pic: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleRegister = () => {
    setIsLoading(true);

    const payload = {
      email: formData.email,
      fullName: formData.fullName,
      password: formData.password,
      focus_area: formData.focus_area || 'Sayısal',
      target_goal: `Zayıf Dersler: ${formData.weak_subjects.join(', ')}`,
      weekly_hours: `${formData.weekly_hours} Saat`,
      focus_time: 'Sabah 🌅',
      daily_goal_hours: parseInt(formData.weekly_hours || '20') / 7.0 || 4.0,
      profile_pic: formData.profile_pic
    };

    fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Kayıt başarısız oldu.');
      }
      return data;
    })
    .then((data) => {
      store.token = data.access_token;
      setIsAILoading(true);
      
      return fetch(`${API_BASE_URL}/api/tasks/`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });
    })
    .then(async (res) => {
      if (!res.ok) throw new Error("Yapay zeka planı kurarken hata oluştu.");
      return res.json();
    })
    .then(() => {
      setTimeout(() => {
        setIsLoading(false);
        setIsAILoading(false);
        router.replace('/(tabs)');
      }, 1500);
    })
    .catch((err) => {
      setIsLoading(false);
      setIsAILoading(false);
      Alert.alert('Hata', err.message || 'Kayıt veya plan sırasında bir hata oluştu.');
    });
  };

  if (isAILoading) {
    return (
      <LinearGradient colors={['#0B1E36', '#115E59', '#064E3B']} style={styles.container}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
           <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 32, shadowColor: '#10B981', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: {width:0, height:10}, elevation: 10 }}>
             <Text style={{ fontSize: 40 }}>✨</Text>
           </View>
           <Text style={{ fontSize: 24, fontWeight: '800', color: '#10B981', textAlign: 'center', marginBottom: 16 }}>
             Senin İçin Harika Bir Plan Kuruyorum...
           </Text>
           <Text style={{ fontSize: 16, color: '#E2E8F0', textAlign: 'center', marginBottom: 40, lineHeight: 24 }}>
             Zayıf olduğun {formData.weak_subjects.join(', ')} derslerini analiz edip sana özel o ilk programı çıkarıyorum. Lütfen bekle.
           </Text>
           <ActivityIndicator size="large" color="#10B981" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(step / 5) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{step} / 5</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#243B55" />
          </TouchableOpacity>
          {renderProgressBar()}
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          
          {/* STEP 1: KİMLİK */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Yolculuğa Başlıyoruz!</Text>
              <Text style={styles.stepSubtitle}>Seni tanımak için temel bilgilerini gir.</Text>
              
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ad Soyad</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Mert Yılmaz"
                    value={formData.fullName}
                    onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-posta</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ornek@ogrenci.com"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Şifre</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity style={[styles.primaryButton, { marginTop: 10 }]} onPress={handleNext}>
                  <Text style={styles.primaryButtonText}>Devam Et</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: ALAN SEÇİMİ */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Hangi alanda zirveye oynuyorsun?</Text>
              <Text style={styles.stepSubtitle}>Yapay zeka planını buna göre şekillendirecek.</Text>
              
              <View style={styles.cardsContainer}>
                {[
                  { id: 'Sayısal', icon: '🧮', desc: 'Matematik & Fen ağırlıklı' },
                  { id: 'Eşit Ağırlık', icon: '⚖️', desc: 'Matematik & Türkçe ağırlıklı' },
                  { id: 'Sözel', icon: '📚', desc: 'Türkçe & Sosyal ağırlıklı' },
                  { id: 'Dil', icon: '🌍', desc: 'Yabancı Dil ağırlıklı' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, formData.focus_area === item.id && styles.cardSelected]}
                    onPress={() => setFormData({ ...formData, focus_area: item.id })}
                  >
                    <Text style={styles.cardIcon}>{item.icon}</Text>
                    <View style={styles.cardTextContainer}>
                      <Text style={[styles.cardTitle, formData.focus_area === item.id && styles.cardTitleSelected]}>{item.id}</Text>
                      <Text style={[styles.cardDesc, formData.focus_area === item.id && styles.cardDescSelected]}>{item.desc}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={formData.focus_area === item.id ? '#10B981' : 'transparent'} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Devam Et</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: ÇALIŞMA TEMPOSU */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Haftada kaç saat ayırabilirsin?</Text>
              <Text style={styles.stepSubtitle}>Gerçekçi ol, planı ona göre bölelim.</Text>
              
              <View style={styles.cardsContainer}>
                {[
                  { id: '10', title: 'Sakin Tempo', icon: '🚶‍♂️', desc: 'Haftada ~10 Saat' },
                  { id: '20', title: 'Dengeli Tempo', icon: '🏃‍♂️', desc: 'Haftada ~20 Saat' },
                  { id: '35', title: 'Sınav Canavarı', icon: '🚀', desc: 'Haftada 35+ Saat' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, formData.weekly_hours === item.id && styles.cardSelected]}
                    onPress={() => setFormData({ ...formData, weekly_hours: item.id })}
                  >
                    <Text style={styles.cardIcon}>{item.icon}</Text>
                    <View style={styles.cardTextContainer}>
                      <Text style={[styles.cardTitle, formData.weekly_hours === item.id && styles.cardTitleSelected]}>{item.title}</Text>
                      <Text style={[styles.cardDesc, formData.weekly_hours === item.id && styles.cardDescSelected]}>{item.desc}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={formData.weekly_hours === item.id ? '#10B981' : 'transparent'} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Devam Et</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: ZAYIF DERS */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Sana en çok çelme takan ders hangisi?</Text>
              <Text style={styles.stepSubtitle}>AI koçun programın %60'ını buraya odaklayacak.</Text>
              
              <View style={styles.gridContainer}>
                {[
                  { id: 'Matematik', icon: '📐' },
                  { id: 'Fizik', icon: '⚡' },
                  { id: 'Kimya', icon: '🧪' },
                  { id: 'Biyoloji', icon: '🧬' },
                  { id: 'Türkçe', icon: '📖' },
                  { id: 'Tarih', icon: '🏛️' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.gridCard, formData.weak_subjects.includes(item.id) && styles.gridCardSelected]}
                    onPress={() => {
                      const updatedSubjects = formData.weak_subjects.includes(item.id)
                        ? formData.weak_subjects.filter(s => s !== item.id)
                        : [...formData.weak_subjects, item.id];
                      setFormData({ ...formData, weak_subjects: updatedSubjects });
                    }}
                  >
                    <Text style={styles.gridCardIcon}>{item.icon}</Text>
                    <Text style={[styles.gridCardTitle, formData.weak_subjects.includes(item.id) && styles.gridCardTitleSelected]}>{item.id}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Devam Et</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: PROFIL FOTOSU & FİNİŞ */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Profil Fotoğrafın</Text>
              <Text style={styles.stepSubtitle}>Son adım! Bir fotoğraf seç ve planını oluşturalım.</Text>
              
              <View style={{ alignItems: 'center', marginBottom: 40 }}>
                <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center' }}>
                  {formData.profile_pic ? (
                    <Image 
                      source={{ uri: formData.profile_pic }} 
                      style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#10B981' }} 
                    />
                  ) : (
                    <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="camera" size={40} color="#94A3B8" />
                    </View>
                  )}
                  <Text style={{ marginTop: 16, color: '#0369A1', fontWeight: '700' }}>
                    {formData.profile_pic ? 'Fotoğrafı Değiştir' : 'Kamera / Fotoğraf Seç'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.primaryButton, { marginTop: 10 }]} onPress={handleRegister} disabled={isLoading}>
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Kaydediliyor...' : 'Planımı Oluştur ✨'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 32,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: '#065F46',
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  cardDescSelected: {
    color: '#047857',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 40,
  },
  gridCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  gridCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  gridCardIcon: {
    fontSize: 36,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  gridCardTitleSelected: {
    color: '#065F46',
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
});
