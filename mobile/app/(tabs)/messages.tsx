import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadows } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/auth';

interface Order {
  id: number;
  product_title: string;
  status: string;
  buyer_name: string;
  seller_name: string;
  unread?: number;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待付款', confirmed: '已付款', handover: '準備面交',
  active: '租借中', returning: '歸還中', completed: '已完成',
  cancelled: '已取消', disputed: '爭議中',
};

export default function MessagesScreen() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) { setLoading(false); return; }
    Promise.all([
      fetch(`${API_URL}/api/orders?role=buyer`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/orders?role=seller`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([b, s]) => {
      const all = [...(b.orders ?? []), ...(s.orders ?? [])];
      const active = all.filter(o => !['completed', 'cancelled'].includes(o.status));
      setOrders(active);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, token]);

  if (!user) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>查看訂單訊息</Text>
          <Text style={styles.emptyDesc}>登入後可與出租者即時溝通</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>前往登入</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>訊息</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={Colors.pink500} />
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>目前沒有進行中的訂單</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => String(o.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item: o }) => (
            <TouchableOpacity style={styles.row} onPress={() => router.push(`/my/order/${o.id}`)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(o.buyer_name === user.name ? o.seller_name : o.buyer_name).charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>{o.product_title}</Text>
                <Text style={styles.rowSub}>
                  {o.buyer_name === user.name ? `出租者：${o.seller_name}` : `租借者：${o.buyer_name}`}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: o.status === 'active' ? Colors.catLeaf : Colors.ink100 }]}>
                <Text style={[styles.statusText, { color: o.status === 'active' ? Colors.success : Colors.ink700 }]}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.ink50 },
  header: { padding: 20, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.ink200 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.ink900 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  emptyIcon: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.ink900 },
  emptyDesc: { fontSize: 14, color: Colors.ink500, textAlign: 'center' },
  loginBtn: { marginTop: 12, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 999, backgroundColor: Colors.pink500, ...Shadows.brand },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, ...Shadows.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.pink500, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  rowName: { fontSize: 14, fontWeight: '600', color: Colors.ink900, marginBottom: 3 },
  rowSub: { fontSize: 12, color: Colors.ink500 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
});
