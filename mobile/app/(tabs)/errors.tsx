import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { store } from '../../store';
import { API_BASE_URL } from '../../lib/config';

export default function ErrorsScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [solutionData, setSolutionData] = useState<any>(null);

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert('İzin Gerekli', 'Kamerayı kullanabilmek için izin vermelisiniz.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.5,
          base64: true,
        });
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert('İzin Gerekli', 'Galerinize erişmek için izin vermelisiniz.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.5,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setSolutionData(null);
        await uploadImageToAI(asset.base64);
      }
    } catch (error) {
      console.error("Resim seçilirken hata oluştu:", error);
      Alert.alert("Hata", "Resim seçilemedi.");
    }
  };

  const uploadImageToAI = async (base64String: string | null | undefined) => {
    if (!base64String) return;
    
    if (!store.token) {
      Alert.alert("Hata", "Oturum süreniz dolmuş, lütfen tekrar giriş yapın.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/errors/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.token}`
        },
        body: JSON.stringify({
          image_data: `data:image/jpeg;base64,${base64String}`,
          subject_name: "Bilinmiyor",
          topic_name: "Bilinmiyor",
        })
      });

      if (!response.ok) {
        throw new Error('Yapay zeka analiz edemedi.');
      }

      const data = await response.json();
      setSolutionData(data);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Hata', error.message || 'Çözüm oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setImageUri(null);
    setSolutionData(null);
  };

  return (
    <LinearGradient colors={['#EBF0EC', '#CBE0D1']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Ionicons name="bulb-outline" size={28} color="#005D32" />
          <Text style={styles.headerTitle}>Hata Kumbarası</Text>
        </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!imageUri ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="camera-outline" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyStateTitle}>Sorunu Çözemedin mi?</Text>
            <Text style={styles.emptyStateDesc}>
              Hemen fotoğrafını çek, yapay zeka senin için adım adım analiz etsin ve çözümlesin.
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => pickImage(true)}>
                <Ionicons name="camera" size={24} color="#FFF" />
                <Text style={styles.actionBtnTextPrimary}>Kamerayı Aç</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => pickImage(false)}>
                <Ionicons name="image" size={24} color="#005D32" />
                <Text style={styles.actionBtnTextSecondary}>Galeriden Seç</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            
            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <Ionicons name="close-circle" size={28} color="#EF4444" />
              <Text style={styles.resetButtonText}>Başka Soru Yükle</Text>
            </TouchableOpacity>

            {loading ? (
              <View style={styles.loadingContainer}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#005D32', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#005D32', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: {width:0, height:4}, elevation: 5 }}>
                  <Text style={{ fontSize: 40 }}>✨</Text>
                </View>
                <Text style={styles.loadingText}>Yapay Zeka Soruyu Gözünden Okuyor...</Text>
                <Text style={styles.loadingSubtext}>Müfredat kontrol ediliyor ve çözüm hazırlanıyor.</Text>
                <ActivityIndicator size="large" color="#005D32" style={{ marginTop: 20 }} />
              </View>
            ) : solutionData ? (
              <View style={styles.solutionCard}>
                <View style={styles.solutionHeader}>
                  <Ionicons name="sparkles" size={20} color="#F59E0B" />
                  <Text style={styles.solutionHeaderTitle}>Yapay Zeka Çözümü</Text>
                </View>

                <View style={styles.tagsRow}>
                  <View style={[styles.tag, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.tagText, { color: '#3B82F6' }]}>{solutionData.subject_name}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: '#F5F3FF' }]}>
                    <Text style={[styles.tagText, { color: '#8B5CF6' }]}>{solutionData.topic_name}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: '#FEF2F2' }]}>
                    <Text style={[styles.tagText, { color: '#EF4444' }]}>{solutionData.difficulty}</Text>
                  </View>
                </View>

                <Text style={styles.solutionContent}>
                  {solutionData.solution_text}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D5DDD6',
    backgroundColor: 'transparent',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B2A1C',
  },
  scroll: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 32,
    borderWidth: 1,
    borderColor: '#D5DDD6',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F6F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B2A1C',
    marginBottom: 10,
  },
  emptyStateDesc: {
    fontSize: 14,
    color: '#6C7E6E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actionRow: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnPrimary: {
    backgroundColor: '#005D32',
    shadowColor: '#005D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  actionBtnTextPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionBtnTextSecondary: {
    color: '#1B2A1C',
    fontSize: 16,
    fontWeight: '700',
  },
  resultContainer: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F3F6F4',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D5DDD6',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D5DDD6',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#005D32',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6C7E6E',
    textAlign: 'center',
  },
  solutionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#D5DDD6',
    shadowColor: '#1B2A1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D5DDD6',
  },
  solutionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#005D32',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  solutionContent: {
    fontSize: 15,
    color: '#1B2A1C',
    lineHeight: 24,
  },
});
