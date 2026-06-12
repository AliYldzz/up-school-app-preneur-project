import { Platform } from 'react-native';

// Android Emülatörleri her zaman bilgisayara 10.0.2.2 üzerinden bağlanır.
export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

console.log('[API_BASE_URL]', API_BASE_URL);
