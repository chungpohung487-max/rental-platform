import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadows } from '@/constants/colors';
import { useAuth } from '@/contexts/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { Alert.alert('請輸入帳號和密碼'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.dismiss();
    } catch (e: any) {
      Alert.alert('登入失敗', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.dismiss()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.logo}>享租 <Text style={{ color: Colors.pink500 }}>Oink!</Text></Text>
          <Text style={styles.title}>歡迎回來</Text>
          <Text style={styles.sub}>登入後即可租借商品、管理出租</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="電子郵件"
              placeholderTextColor={Colors.ink400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="密碼"
              placeholderTextColor={Colors.ink400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
              <Text style={styles.primaryBtnText}>{loading ? '登入中…' : '登入'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>還沒有帳號？</Text>
            <TouchableOpacity onPress={() => { router.dismiss(); router.push('/register'); }}>
              <Text style={styles.footerLink}>立即註冊</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, alignItems: 'flex-end' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.ink100, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: Colors.ink700 },
  content: { flex: 1, padding: 28, paddingTop: 16 },
  logo: { fontSize: 24, fontWeight: '900', color: Colors.ink900, marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.ink900, marginBottom: 6 },
  sub: { fontSize: 14, color: Colors.ink500, marginBottom: 32 },
  form: { gap: 12 },
  input: {
    height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.ink200,
    paddingHorizontal: 16, fontSize: 15, color: Colors.ink900, backgroundColor: Colors.ink50,
  },
  primaryBtn: {
    height: 52, borderRadius: 999, backgroundColor: Colors.pink500,
    alignItems: 'center', justifyContent: 'center', marginTop: 8, ...Shadows.brand,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14, color: Colors.ink500 },
  footerLink: { fontSize: 14, color: Colors.pink600, fontWeight: '700' },
});
