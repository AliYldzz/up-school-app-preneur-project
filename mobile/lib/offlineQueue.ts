import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const QUEUE_KEY = 'OFFLINE_TASK_QUEUE';

export interface TaskPayload {
  id: number | string;   // Task ID (Supabase UUID or int)
  status?: string;
  actual_time?: number;
  version?: number;
}

/**
 * Görevi çevrimdışı kuyruğa ekler.
 * Aynı ID ile kuyrukta zaten bir görev varsa, onu günceller.
 */
export const addToOfflineQueue = async (task: TaskPayload) => {
  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
    let queue: TaskPayload[] = queueStr ? JSON.parse(queueStr) : [];

    // Çakışmayı engelle: Eğer kuyrukta aynı ID'li görev varsa güncelle
    const existingIndex = queue.findIndex(t => t.id === task.id);
    if (existingIndex > -1) {
      queue[existingIndex] = { ...queue[existingIndex], ...task };
    } else {
      queue.push(task);
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('[OfflineQueue] Görev kuyruğa eklendi:', task.id);
  } catch (error) {
    console.error('[OfflineQueue] Kuyruğa ekleme hatası:', error);
  }
};

/**
 * Cihaz internete bağlandığında çağrılacak olan senkronizasyon fonksiyonu.
 * Supabase SDK kullanarak her görevi günceller.
 */
export const syncOfflineQueue = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueStr) return;

    const queue: TaskPayload[] = JSON.parse(queueStr);
    if (queue.length === 0) return;

    console.log(`[OfflineQueue] Senkronizasyon başlatılıyor... ${queue.length} görev gönderiliyor.`);

    const promises = queue.map(task =>
      supabase
        .from('tasks')
        .update({
          status: task.status,
          actual_time: task.actual_time,
        })
        .eq('id', task.id)
        .eq('user_id', user.id)
    );

    const results = await Promise.all(promises);
    const hasErrors = results.some(r => r.error);

    if (!hasErrors) {
      console.log('[OfflineQueue] Senkronizasyon BAŞARILI!');
      await AsyncStorage.removeItem(QUEUE_KEY);
    } else {
      console.warn('[OfflineQueue] Bazı görevler senkronize edilemedi.');
    }
  } catch (error) {
    console.error('[OfflineQueue] Senkronizasyon hatası (İnternet yok olabilir):', error);
  }
};
