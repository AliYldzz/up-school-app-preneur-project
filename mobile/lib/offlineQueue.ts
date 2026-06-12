import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';
import { store } from '../store';

const QUEUE_KEY = 'OFFLINE_TASK_QUEUE';

export interface TaskPayload {
  title: string;
  status?: string;
  priority_score?: number;
  subject_name?: string;
  estimated_time?: number;
  actual_time?: number;
  version?: number;
  is_deleted?: boolean;
}

/**
 * Görevi çevrimdışı kuyruğa ekler.
 * Aynı görev başlığıyla (title) kuyrukta zaten bir görev varsa, onu ezer/günceller.
 */
export const addToOfflineQueue = async (task: TaskPayload) => {
  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
    let queue: TaskPayload[] = queueStr ? JSON.parse(queueStr) : [];

    // Çakışmayı engelle: Eğer kuyrukta aynı isimli görev varsa güncelle
    const existingIndex = queue.findIndex(t => t.title === task.title);
    if (existingIndex > -1) {
      queue[existingIndex] = { ...queue[existingIndex], ...task };
    } else {
      queue.push(task);
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('[OfflineQueue] Görev kuyruğa eklendi:', task.title);
  } catch (error) {
    console.error('[OfflineQueue] Kuyruğa ekleme hatası:', error);
  }
};

/**
 * Cihaz internete bağlandığında çağrılacak olan senkronizasyon fonksiyonu.
 */
export const syncOfflineQueue = async () => {
  if (!store.token) return;

  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueStr) return; // Kuyruk boş

    const queue: TaskPayload[] = JSON.parse(queueStr);
    if (queue.length === 0) return;

    console.log(`[OfflineQueue] Senkronizasyon başlatılıyor... ${queue.length} görev gönderiliyor.`);

    const response = await fetch(`${API_BASE_URL}/api/tasks/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${store.token}`
      },
      body: JSON.stringify({ tasks: queue })
    });

    if (response.ok) {
      console.log('[OfflineQueue] Senkronizasyon BAŞARILI!');
      // Kuyruğu temizle
      await AsyncStorage.removeItem(QUEUE_KEY);
    } else {
      console.warn('[OfflineQueue] Senkronizasyon BAŞARISIZ:', response.status);
    }
  } catch (error) {
    console.error('[OfflineQueue] Senkronizasyon hatası (İnternet yok olabilir):', error);
  }
};
