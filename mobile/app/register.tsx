import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../lib/config';
import { store } from '../store';

const TYT_SUB_TOPICS: Record<string, string[]> = {
  'Matematik': ['Sayılar & Cebir', 'Problemler', 'Çarpanlara Ayırma', 'Fonksiyonlar (Temel)', 'Kümeler & Veri'],
  'Fizik': ['Fizik Bilimi & Madde', 'Kuvvet & Hareket (Temel)', 'Isı, Sıcaklık & Enerji', 'Elektrik (Temel)', 'Basınç, Dalgalar & Optik'],
  'Kimya': ['Kimya Bilimi & Atom', 'Kimyasal Etkileşimler & Haller', 'Karışımlar & Asit-Baz'],
  'Biyoloji': ['Hücre & Canlılar', 'Kalıtım & Ekoloji'],
  'Türkçe': ['Paragraf & Anlam', 'Dil Bilgisi', 'Yazım & Noktalama'],
  'Tarih': ['İlk & Orta Çağ Tarihi', 'Osmanlı Tarihi', 'İnkılap Tarihi'],
  'Coğrafya': ['Harita & Doğa Bilgisi', 'Nüfus & Göç', 'Yer Şekilleri & Afetler']
};

const AYT_SUB_TOPICS: Record<string, string[]> = {
  'Matematik': ['LTI (Türev & İntegral)', 'Trigonometri', 'Fonksiyonlar (İleri)', 'Logaritma & Diziler'],
  'Fizik': ['Mekanik & Newton (İleri)', 'Elektrik & Manyetizma (İleri)', 'Basit Harmonik Hareket', 'Modern Fizik'],
  'Kimya': ['Tepkimeler & Enerji', 'Organik Kimya', 'Kimya ve Elektrik'],
  'Biyoloji': ['İnsan Fizyolojisi', 'Hücresel Enerji'],
  'Edebiyat': ['Şiir & Edebi Sanatlar', 'Edebiyat Dönemleri', 'Yazar-Eser Eşleştirmesi'],
  'Tarih': ['Tarih Bilimi & İlk Uygarlıklar', 'Türk-İslam & Osmanlı Tarihi', 'Çağdaş Türk ve Dünya Tarihi'],
  'Coğrafya': ['Ekosistem ve Biyoçeşitlilik', 'Küresel Ortam ve Ülkeler', 'Çevre, Toplum & Ekonomi'],
  'Felsefe Grb.': ['Felsefe Tarihi & Alanları', 'Psikoloji', 'Sosyoloji & Mantık'],
  'Din Kültürü': ['İnanç & İbadet', 'Ahlak & Değerler'],
  'Yabancı Dil': ['Dilbilgisi & Kelime', 'Okuma Anlama', 'Çeviri & Cümle']
};

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    focus_area: '',
    weekly_hours: '',
    tyt_weak_subjects: [] as string[],
    tyt_weak_topics: [] as string[],
    ayt_weak_subjects: [] as string[],
    ayt_weak_topics: [] as string[],
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
    if (step === 4 && formData.tyt_weak_subjects.length === 0) {
      Alert.alert('Eksik Seçim', 'Lütfen en az bir TYT zayıf ders seçin.');
      return;
    }
    if (step === 5 && formData.ayt_weak_subjects.length === 0) {
      Alert.alert('Eksik Seçim', 'Lütfen en az bir AYT zayıf ders seçin.');
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

    const tytDetails = formData.tyt_weak_subjects.map(subject => {
      const topics = formData.tyt_weak_topics
        .filter(t => t.startsWith(`${subject}:`))
        .map(t => t.split(':')[1]);
      return topics.length > 0 ? `${subject} (${topics.join(', ')})` : subject;
    }).join(', ');

    const aytDetails = formData.ayt_weak_subjects.map(subject => {
      const topics = formData.ayt_weak_topics
        .filter(t => t.startsWith(`${subject}:`))
        .map(t => t.split(':')[1]);
      return topics.length > 0 ? `${subject} (${topics.join(', ')})` : subject;
    }).join(', ');

    const payload = {
      email: formData.email,
      fullName: formData.fullName,
      password: formData.password,
      focus_area: formData.focus_area || 'Sayısal',
      target_goal: `TYT Zayıf Dersleri: ${tytDetails} | AYT Zayıf Dersleri: ${aytDetails}`,
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
      <LinearGradient colors={['#EBF0EC', '#CBE0D1']} style={styles.container}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
           <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#CBE0D1', justifyContent: 'center', alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: '#B2C7B8' }}>
             <Text style={{ fontSize: 40 }}>✨</Text>
           </View>
           <Text style={{ fontSize: 24, fontWeight: '800', color: '#1B2A1C', textAlign: 'center', marginBottom: 16 }}>
             Senin İçin Harika Bir Plan Kuruyorum...
           </Text>
           <Text style={{ fontSize: 16, color: '#6C7E6E', textAlign: 'center', marginBottom: 40, lineHeight: 24 }}>
             Zayıf olduğun dersleri analiz edip sana özel o ilk programı çıkarıyorum. Lütfen bekle.
           </Text>
           <ActivityIndicator size="large" color="#005D32" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(step / 6) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{step} / 6</Text>
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
                    <Ionicons name="checkmark-circle" size={24} color={formData.focus_area === item.id ? '#2ECC71' : 'transparent'} />
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
                    <Ionicons name="checkmark-circle" size={24} color={formData.weekly_hours === item.id ? '#2ECC71' : 'transparent'} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Devam Et</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: TYT ZAYIF DERS */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>TYT'de en çok hangi dersler seni zorluyor?</Text>
              <Text style={styles.stepSubtitle}>AI koçun TYT programını buna göre ayarlayacak.</Text>
              
              <View style={styles.gridContainer}>
                {[
                  { id: 'Matematik', icon: '📐' },
                  { id: 'Fizik', icon: '⚡' },
                  { id: 'Kimya', icon: '🧪' },
                  { id: 'Biyoloji', icon: '🧬' },
                  { id: 'Türkçe', icon: '📖' },
                  { id: 'Tarih', icon: '🏛️' },
                  { id: 'Coğrafya', icon: '🌍' },
                ].map((item) => (
                  <TouchableOpacity
                    key={'tyt'+item.id}
                    style={[styles.gridCard, formData.tyt_weak_subjects.includes(item.id) && styles.gridCardSelected]}
                    onPress={() => {
                      const updatedSubjects = formData.tyt_weak_subjects.includes(item.id)
                        ? formData.tyt_weak_subjects.filter(s => s !== item.id)
                        : [...formData.tyt_weak_subjects, item.id];
                      
                      const updatedTopics = formData.tyt_weak_topics.filter(t => !t.startsWith(`${item.id}:`));

                      setFormData({ 
                        ...formData, 
                        tyt_weak_subjects: updatedSubjects,
                        tyt_weak_topics: updatedSubjects.includes(item.id) ? formData.tyt_weak_topics : updatedTopics
                      });
                    }}
                  >
                    <Text style={styles.gridCardIcon}>{item.icon}</Text>
                    <Text style={[styles.gridCardTitle, formData.tyt_weak_subjects.includes(item.id) && styles.gridCardTitleSelected, { fontSize: 12 }]}>{item.id}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {formData.tyt_weak_subjects.length > 0 && (
                <View style={styles.subTopicsContainer}>
                  <Text style={styles.subTopicsSectionTitle}>Zorlandığın Alt Konuları Seç (Detaylı Analiz):</Text>
                  {formData.tyt_weak_subjects.map((subject) => {
                    const topics = TYT_SUB_TOPICS[subject] || [];
                    if (topics.length === 0) return null;
                    return (
                      <View key={'tyt_topics_'+subject} style={styles.subTopicSubjectRow}>
                        <Text style={styles.subTopicSubjectName}>{subject}</Text>
                        <View style={styles.subTopicChipsContainer}>
                          {topics.map((topic) => {
                            const topicKey = `${subject}:${topic}`;
                            const isSelected = formData.tyt_weak_topics.includes(topicKey);
                            return (
                              <TouchableOpacity
                                key={topicKey}
                                style={[styles.topicChip, isSelected && styles.topicChipSelected]}
                                onPress={() => {
                                  const updatedTopics = isSelected
                                    ? formData.tyt_weak_topics.filter(t => t !== topicKey)
                                    : [...formData.tyt_weak_topics, topicKey];
                                  setFormData({ ...formData, tyt_weak_topics: updatedTopics });
                                }}
                              >
                                <Text style={[styles.topicChipText, isSelected && styles.topicChipTextSelected]}>
                                  {topic}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Devam Et</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: AYT ZAYIF DERS */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>AYT'de hedefine giden yolda engellerin neler?</Text>
              <Text style={styles.stepSubtitle}>Bölümüne göre alan derslerinden seçim yap.</Text>
              
              <View style={styles.gridContainer}>
                {(formData.focus_area === 'Sayısal' ? [
                  { id: 'Matematik', icon: '📐' },
                  { id: 'Fizik', icon: '⚡' },
                  { id: 'Kimya', icon: '🧪' },
                  { id: 'Biyoloji', icon: '🧬' }
                ] : formData.focus_area === 'Eşit Ağırlık' ? [
                  { id: 'Matematik', icon: '📐' },
                  { id: 'Edebiyat', icon: '📚' },
                  { id: 'Tarih', icon: '🏛️' },
                  { id: 'Coğrafya', icon: '🌍' }
                ] : formData.focus_area === 'Sözel' ? [
                  { id: 'Edebiyat', icon: '📚' },
                  { id: 'Tarih', icon: '🏛️' },
                  { id: 'Coğrafya', icon: '🌍' },
                  { id: 'Felsefe Grb.', icon: '🤔' },
                  { id: 'Din Kültürü', icon: '🕌' }
                ] : formData.focus_area === 'Dil' ? [
                  { id: 'Yabancı Dil', icon: '🗣️' }
                ] : []).map((item) => (
                  <TouchableOpacity
                    key={'ayt'+item.id}
                    style={[styles.gridCard, formData.ayt_weak_subjects.includes(item.id) && styles.gridCardSelected]}
                    onPress={() => {
                      const updatedSubjects = formData.ayt_weak_subjects.includes(item.id)
                        ? formData.ayt_weak_subjects.filter(s => s !== item.id)
                        : [...formData.ayt_weak_subjects, item.id];
                      
                      const updatedTopics = formData.ayt_weak_topics.filter(t => !t.startsWith(`${item.id}:`));

                      setFormData({ 
                        ...formData, 
                        ayt_weak_subjects: updatedSubjects,
                        ayt_weak_topics: updatedSubjects.includes(item.id) ? formData.ayt_weak_topics : updatedTopics
                      });
                    }}
                  >
                    <Text style={styles.gridCardIcon}>{item.icon}</Text>
                    <Text style={[styles.gridCardTitle, formData.ayt_weak_subjects.includes(item.id) && styles.gridCardTitleSelected, { fontSize: 12 }]}>{item.id}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {formData.ayt_weak_subjects.length > 0 && (
                <View style={styles.subTopicsContainer}>
                  <Text style={styles.subTopicsSectionTitle}>Zorlandığın Alt Konuları Seç (Detaylı Analiz):</Text>
                  {formData.ayt_weak_subjects.map((subject) => {
                    const topics = AYT_SUB_TOPICS[subject] || [];
                    if (topics.length === 0) return null;
                    return (
                      <View key={'ayt_topics_'+subject} style={styles.subTopicSubjectRow}>
                        <Text style={styles.subTopicSubjectName}>{subject}</Text>
                        <View style={styles.subTopicChipsContainer}>
                          {topics.map((topic) => {
                            const topicKey = `${subject}:${topic}`;
                            const isSelected = formData.ayt_weak_topics.includes(topicKey);
                            return (
                              <TouchableOpacity
                                key={topicKey}
                                style={[styles.topicChip, isSelected && styles.topicChipSelected]}
                                onPress={() => {
                                  const updatedTopics = isSelected
                                    ? formData.ayt_weak_topics.filter(t => t !== topicKey)
                                    : [...formData.ayt_weak_topics, topicKey];
                                  setFormData({ ...formData, ayt_weak_topics: updatedTopics });
                                }}
                              >
                                <Text style={[styles.topicChipText, isSelected && styles.topicChipTextSelected]}>
                                  {topic}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Devam Et</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 6: PROFIL FOTOSU & FİNİŞ */}
          {step === 6 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Profil Fotoğrafın</Text>
              <Text style={styles.stepSubtitle}>Son adım! Bir fotoğraf seç ve planını oluşturalım.</Text>
              
              <View style={{ alignItems: 'center', marginBottom: 40 }}>
                <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center' }}>
                  {formData.profile_pic ? (
                    <Image 
                      source={{ uri: formData.profile_pic }} 
                      style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#2ECC71' }} 
                    />
                  ) : (
                    <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#F3F6F4', borderWidth: 2, borderColor: '#D5DDD6', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="camera" size={40} color="#6C7E6E" />
                    </View>
                  )}
                  <Text style={{ marginTop: 16, color: '#3498DB', fontWeight: '700' }}>
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
    backgroundColor: '#EBF0EC', // Soft Sage Grey
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
    backgroundColor: '#D5DDD6', // Ince Adaçayı
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ECC71', // Canlı Yeşil
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C7E6E', // Muted Sage Gray
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
    color: '#1B2A1C', // Deep Pine Green
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#6C7E6E', // Muted Sage Gray
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
    backgroundColor: '#FFFFFF', // Saf Beyaz Kart
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D5DDD6',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  cardSelected: {
    borderColor: '#2ECC71',
    backgroundColor: '#EBF5EC', // Soft light sage green background
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
    color: '#1B2A1C', // Deep Pine Green
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: '#005D32', // Forest Green
  },
  cardDesc: {
    fontSize: 13,
    color: '#6C7E6E',
  },
  cardDescSelected: {
    color: '#4A5D4C',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
  },
  gridCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D5DDD6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gridCardSelected: {
    borderColor: '#2ECC71',
    backgroundColor: '#EBF5EC',
  },
  gridCardIcon: {
    fontSize: 36,
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2A1C',
  },
  gridCardTitleSelected: {
    color: '#005D32',
  },
  primaryButton: {
    backgroundColor: '#005D32', // Koyu Orman Yeşili
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#005D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
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
    borderColor: '#D5DDD6',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B2A1C',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F3F6F4',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D5DDD6',
    color: '#1B2A1C',
  },
  subTopicsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D5DDD6',
    marginBottom: 24,
  },
  subTopicsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2A1C',
    marginBottom: 16,
  },
  subTopicSubjectRow: {
    marginBottom: 16,
  },
  subTopicSubjectName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3498DB', // Secondary Blue
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subTopicChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DDD6',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  topicChipSelected: {
    backgroundColor: '#EBF5EC',
    borderColor: '#2ECC71',
  },
  topicChipText: {
    color: '#6C7E6E',
    fontSize: 12,
    fontWeight: '600',
  },
  topicChipTextSelected: {
    color: '#005D32',
  },
});
