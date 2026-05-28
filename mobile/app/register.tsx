import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadows } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/auth';

export default function RegisterScreen() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    if (!phone.trim()) { Alert.alert('請輸入手機號碼'); return; }
    try {
      const res = await fetch(`${API_URL}/api/auth/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const d = await res.json();
      setOtpSent(true);
      if (d.otp) setOtpCode(`（測試 OTP：${d.otp}）`);
    } catch {
      Alert.alert('無法發送 OTP，請稍後再試');
    }
  }

  async function handleRegister() {
    if (!name || !email || !password || !phone || !otp) {
      Alert.alert('請填寫所有欄位'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, phone: phone.trim(), otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '註冊失敗');
      await login(email.trim(), password);
      router.dismiss();
    } catch (e: any) {
      Alert.alert('註冊失敗', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.dismiss()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.logo}>享租 <Text style={{ color: Colors.pink500 }}>Oink!</Text></Text>
          <Text style={styles.title}>建立帳號</Text>
          <Text style={styles.sub}>加入租借社群，開始租東西或出租閒置物品</Text>

          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="姓名" placeholderTextColor={Colors.ink400} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="電子郵件" placeholderTextColor={Colors.ink400} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <TextInput style={styles.input} placeholder="密碼" placeholderTextColor={Colors.ink400} value={password} onChangeText={setPassword} secureTextEntry />

            <View style={styles.phoneRow}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="手機號碼（09xx…）" placeholderTextColor={Colors.ink400} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TouchableOpacity style={styles.otpBtn} onPress={sendOtp}>
                <Text style={styles.otpBtnText}>{otpSent ? '重發' : '發送 OTP'}</Text>
              </TouchableOpacity>
            </View>

            {otpCode ? <Text style={styles.otpHint}>{otpCode}</Text> : null}

            <TextInput style={styles.input} placeholder="OTP 驗證碼" placeholderTextColor={Colors.ink400} value={otp} onChangeText={setOtp} keyboardType="number-pad" />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
              <Text style={styles.primaryBtnText}>{loading ? '註冊中…' : '完成註冊'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>已有帳號？</Text>
            <TouchableOpacity onPress={() => { router.dismiss(); router.push('/login'); }}>
              <Text style={styles.footerLink}>前往登入</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, alignItems: 'flex-end' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.ink100, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: Colors.ink700 },
  content: { padding: 28, paddingTop: 8, paddingBottom: 40 },
  logo: { fontSize: 22, fontWeight: '900', color: Colors.ink900, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.ink900, marginBottom: 6 },
  sub: { fontSize: 14, color: Colors.ink500, marginBottom: 28 },
  form: { gap: 12 },
  input: { height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.ink200, paddingHorizontal: 16, fontSize: 15, color: Colors.ink900, backgroundColor: Colors.ink50 },
  phoneRow: { flexDirection: 'row', gap: 10 },
  otpBtn: { paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.pink500, alignItems: 'center', justifyContent: 'center', height: 52 },
  otpBtnText: { color: Colors.pink600, fontWeight: '700', fontSize: 13 },
  otpHint: { fontSize: 12, color: Colors.success, fontWeight: '500' },
  primaryBtn: { height: 52, borderRadius: 999, backgroundColor: Colors.pink500, alignItems: 'center', justifyContent: 'center', marginTop: 8, ...Shadows.brand },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: Colors.ink500 },
  footerLink: { fontSize: 14, color: Colors.pink600, fontWeight: '700' },
});
