import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Shadows } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/auth';

interface Order {
  id: number;
  product_title: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  platform_fee: number;
  deposit: number;
  status: string;
}

export default function CheckoutScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setOrder(d.order ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId, token]);

  async function handlePay() {
    if (!order) return;
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      if (!res.ok) throw new Error('付款失敗');
      Alert.alert('付款成功 🎉', '訂單已確認，等待出租者確認面交時間。', [
        { text: '查看訂單', onPress: () => { router.dismiss(); router.push('/my/rentals'); } },
      ]);
    } catch (e: any) {
      Alert.alert('錯誤', e.message);
    } finally {
      setPaying(false);
    }
  }

  if (loading) return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ActivityIndicator style={{ flex: 1 }} color={Colors.pink500} />
    </SafeAreaView>
  );

  if (!order) return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.ink500 }}>訂單不存在</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.dismiss()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>確認付款</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.productTitle}>{order.product_title}</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>租借期間</Text>
            <Text style={styles.dateVal}>{order.start_date} — {order.end_date}</Text>
          </View>

          <View style={styles.divider} />

          {[
            ['租金', `NT$ ${(order.total_amount - order.platform_fee - order.deposit).toLocaleString()}`],
            ['平台手續費 (5%)', `NT$ ${order.platform_fee.toLocaleString()}`],
            ['押金（歸還後退回）', `NT$ ${order.deposit.toLocaleString()}`],
          ].map(([k, v]) => (
            <View key={k} style={styles.lineItem}>
              <Text style={styles.lineKey}>{k}</Text>
              <Text style={styles.lineVal}>{v}</Text>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.lineItem}>
            <Text style={styles.totalKey}>總計</Text>
            <Text style={styles.totalVal}>NT$ {order.total_amount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Simulated card */}
        <View style={styles.creditCard}>
          <Text style={styles.creditLabel}>模擬信用卡</Text>
          <Text style={styles.creditNum}>•••• •••• •••• 4242</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={paying}>
          {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>確認付款 NT$ {order.total_amount.toLocaleString()}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.ink50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.ink200 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.ink100, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: Colors.ink700 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.ink900 },
  content: { flex: 1, padding: 16, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 20, ...Shadows.sm },
  productTitle: { fontSize: 16, fontWeight: '700', color: Colors.ink900, marginBottom: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dateLabel: { fontSize: 13, color: Colors.ink500 },
  dateVal: { fontSize: 13, fontWeight: '600', color: Colors.ink900 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.ink200, marginVertical: 14 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  lineKey: { fontSize: 14, color: Colors.ink700 },
  lineVal: { fontSize: 14, color: Colors.ink900 },
  totalKey: { fontSize: 16, fontWeight: '800', color: Colors.ink900 },
  totalVal: { fontSize: 18, fontWeight: '800', color: Colors.ink900 },
  creditCard: { backgroundColor: Colors.ink900, borderRadius: 16, padding: 20, ...Shadows.sm },
  creditLabel: { fontSize: 11, color: 'rgba(255,255,255,.6)', marginBottom: 8 },
  creditNum: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  bottom: { padding: 16, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.ink200 },
  payBtn: { height: 54, borderRadius: 999, backgroundColor: Colors.pink500, alignItems: 'center', justifyContent: 'center', ...Shadows.brand },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
