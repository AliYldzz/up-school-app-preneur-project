import { Platform } from 'react-native';

// Geliştirme (Lokal) veri tabanı için:
// export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

// Canlı Vercel Sunucusu için:
export const API_BASE_URL = 'https://up-school-app-preneur-project.vercel.app';

console.log('[API_BASE_URL]', API_BASE_URL);
