# Mobile — Sınav Yol Arkadaşım

Bu klasörde Flutter artık kullanılmıyor.
`pubspec.yaml` ve `lib/` klasörü kaldırılabilir.

## Teknoloji
- **Framework**: Expo (React Native) ~51
- **Routing**: Expo Router v3
- **Build**: EAS Cloud Build

## Kurulum

```bash
cd mobile
npm install
```

## Geliştirme Sunucusu
```bash
npm start
# Expo Go uygulamasıyla telefonunda test edebilirsin
```

## EAS Cloud Build (SDK Gerekmez)

```bash
# EAS CLI kur
npm install -g eas-cli

# Expo hesabına giriş yap (expo.dev)
eas login

# Projeyi EAS'a bağla (ilk seferinde)
eas build:configure

# Android APK (test için)
eas build --platform android --profile preview

# iOS (Apple Developer hesabı gerekir)
eas build --platform ios --profile preview

# Production build
eas build --platform all --profile production
```

## Klasör Yapısı

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout
│   ├── +not-found.tsx       # 404 sayfası
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar
│       ├── index.tsx        # Ana sayfa
│       ├── lessons.tsx      # Dersler
│       └── profile.tsx      # Profil
├── assets/
│   └── images/              # icon.png, splash.png buraya gelecek
├── app.json                 # Expo konfigürasyonu
├── eas.json                 # EAS Build konfigürasyonu
├── babel.config.js
└── tsconfig.json
```

## Store Yayını

1. `app.json` içindeki `BURAYA_EAS_PROJECT_ID_GELECEK` kısmını `eas build:configure` sonrası otomatik dolar
2. `eas.json` içindeki Apple/Google bilgilerini doldur
3. `eas submit --platform android` → Play Store
4. `eas submit --platform ios` → App Store Connect
