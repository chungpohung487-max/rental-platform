import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadows } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/auth';

interface Stats { active: number; history: number; }

function Row({ icon, label, hint, onPress }: { icon: string; label: string; hint?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.rowIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      {onPress && <Text style={styles.rowChevron}>›</Text>}
    </TouchableOpacity>
  );
}

export default function MeScreen() {
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState<Stats>({ active: 0, history: 0 });

  useEffect(() => {
    if (!user || !token) return;
    fetch(`${API_URL}/api/orders?role=buyer`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const orders = d.orders ?? [];
        setStats({
          active: orders.filter((o: any) => !['completed', 'cancelled'].includes(o.status)).length,
          history: orders.filter((o: any) => o.status === 'completed').length,
        });
      }).catch(() => {});
  }, [user, token]);

  function handleLogout() {
    Alert.alert('確認登出', '確定要登出嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '登出', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.bigIcon}>👤</Text>
          <Text style={styles.guestTitle}>歡迎加入享租 Oink!</Text>
          <Text style={styles.guestDesc}>登入後可管理租借、查看訂單、出租商品</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/login')}>
            <Text style={styles.primaryBtnText}>登入</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/register')}>
            <Text style={styles.secondaryBtnText}>註冊新帳號</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileBlock}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              {user.phone_verified === 1 && (
                <View style={styles.verifiedDot}><Text style={{ color: '#fff', fontSize: 9 }}>✓</Text></View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileMeta}>
                {user.phone_verified === 1 ? '已驗證' : '未驗證'}
                {user.rating > 0 ? ` · ★ ${user.rating.toFixed(1)} · ${user.rating_count} 筆評價` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>編輯</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              [String(stats.active), '進行中'],
              [String(stats.history), '歷史租借'],
            ].map(([n, l]) => (
              <View key={l} style={styles.statItem}>
                <Text style={styles.statNum}>{n}</Text>
                <Text style={styles.statLabel}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Renter section */}
        <View style={styles.card}>
          <Row icon="📦" label="進行中的租借" hint={stats.active > 0 ? `${stats.active} 個訂單進行中` : undefined} onPress={() => router.push('/my/rentals')} />
          <Row icon="♡" label="我的收藏" onPress={() => {}} />
          <Row icon="💰" label="押金 / 退款" onPress={() => {}} />
          <Row icon="★" label="評價中心" onPress={() => {}} />
        </View>

        {/* Lister section */}
        <View style={styles.card}>
          <Row icon="📈" label="出租賺取收入" hint="閒置物品變現，每月平均 NT$ 8,000" onPress={() => router.push('/my/lending')} />
          <Row icon="🏷" label="我的商品" onPress={() => router.push('/my/listings')} />
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Row icon="🛡" label="身分與驗證" hint={user.phone_verified === 1 ? '已驗證' : '未驗證'} onPress={() => {}} />
          <Row icon="⚙️" label="設定 / 通知" onPress={() => {}} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>登出</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.ink50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  bigIcon: { fontSize: 64, marginBottom: 8 },
  guestTitle: { fontSize: 20, fontWeight: '800', color: Colors.ink900 },
  guestDesc: { fontSize: 14, color: Colors.ink500, textAlign: 'center' },
  primaryBtn: { width: '100%', paddingVertical: 14, borderRadius: 999, backgroundColor: Colors.pink500, alignItems: 'center', marginTop: 8, ...Shadows.brand },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { width: '100%', paddingVertical: 13, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.ink200, alignItems: 'center' },
  secondaryBtnText: { color: Colors.ink700, fontWeight: '600', fontSize: 15 },

  profileBlock: { backgroundColor: '#fff', padding: 20, marginBottom: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.pink500, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 24 },
  verifiedDot: {
    position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.success, borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 18, fontWeight: '700', color: Colors.ink900, marginBottom: 3 },
  profileMeta: { fontSize: 12, color: Colors.ink500 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: Colors.ink200 },
  editBtnText: { fontSize: 12, fontWeight: '600', color: Colors.ink700 },

  statsRow: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, backgroundColor: Colors.pink50, borderRadius: 14, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.pink700 },
  statLabel: { fontSize: 11, color: Colors.ink700, fontWeight: '600', marginTop: 2 },

  card: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 4, ...Shadows.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.ink200 },
  rowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.pink50, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600', color: Colors.ink900 },
  rowHint: { fontSize: 11, color: Colors.ink500, marginTop: 2 },
  rowChevron: { fontSize: 20, color: Colors.ink400 },

  logoutBtn: { marginHorizontal: 16, marginTop: 8, paddingVertical: 14, borderRadius: 999, backgroundColor: Colors.ink100, alignItems: 'center' },
  logoutText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
});
