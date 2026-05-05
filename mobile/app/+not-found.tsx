import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sayfa Bulunamadı' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>Sayfa bulunamadı.</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>Ana sayfaya dön</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0B2E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  link: {
    backgroundColor: '#7C6BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  linkText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
