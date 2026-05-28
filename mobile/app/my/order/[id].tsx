import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Shadows } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/auth';

const STATUS_LABEL: Record<string, string> = {
  pending: '待付款', confirmed: '已付款', handover: '準備面交',
  active: '租借中', returning: '歸還中', completed: '已完成',
  cancelled: '已取消', disputed: '爭議中',
};

interface Message { id: number; sender_name: string; content: string; created_at: string; sender_id: number; }
interface Order {
  id: number; product_title: string; start_date: string; end_date: string;
  total_amount: number; deposit: number; status: string;
  buyer_id: number; seller_id: number; buyer_name: string; seller_name: string;
  buyer_confirmed: number; seller_confirmed: number;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadOrder() {
    const [o, m] = await Promise.all([
      fetch(`${API_URL}/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/messages?order_id=${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);
    setOrder(o.order ?? null);
    setMessages(m.messages ?? []);
  }

  useEffect(() => {
    loadOrder().finally(() => setLoading(false));
    const interval = setInterval(loadOrder, 5000);
    return () => clearInterval(interval);
  }, [id, token]);

  async function sendMsg() {
    if (!msgText.trim()) return;
    const text = msgText; setMsgText('');
    await fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ order_id: Number(id), content: text }),
    });
    loadOrder();
  }

  async function confirmOrder() {
    await fetch(`${API_URL}/api/orders/${id}/confirm`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    loadOrder();
  }

  if (loading) return <SafeAreaView style={styles.root} edges={['top']}><ActivityIndicator style={{ flex: 1 }} color={Colors.pink500} /></SafeAreaView>;
  if (!order) return <SafeAreaView style={styles.root} edges={['top']}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>訂單不存在</Text></View></SafeAreaView>;

  const isBuyer = user?.id === order.buyer_id;
  const hasConfirmed = isBuyer ? order.buyer_confirmed : order.seller_confirmed;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{order.product_title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: order.status === 'active' ? Colors.catLeaf : Colors.ink100 }]}>
          <Text style={[styles.statusText, { color: order.status === 'active' ? Colors.success : Colors.ink700 }]}>{STATUS_LABEL[order.status] ?? order.status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order summary */}
        <View style={styles.card}>
          {[
            ['租借期間', `${order.start_date} — ${order.end_date}`],
            ['總計', `NT$ ${order.total_amount.toLocaleString()}`],
            ['押金', `NT$ ${order.deposit.toLocaleString()}`],
            [isBuyer ? '出租者' : '租借者', isBuyer ? order.seller_name : order.buyer_name],
          ].map(([k, v]) => (
            <View key={k} style={styles.lineItem}>
              <Text style={styles.lineKey}>{k}</Text>
              <Text style={styles.lineVal}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Confirm action */}
        {order.status === 'confirmed' && !hasConfirmed && (
          <TouchableOpacity style={styles.actionBtn} onPress={confirmOrder}>
            <Text style={styles.actionBtnText}>確認租借</Text>
          </TouchableOpacity>
        )}

        {/* Messages */}
        <Text style={styles.sectionTitle}>訊息</Text>
        {messages.length === 0 ? (
          <Text style={styles.noMsg}>目前沒有訊息，傳送訊息給{isBuyer ? '出租者' : '租借者'}吧</Text>
        ) : (
          messages.map(m => {
            const isMe = m.sender_id === user?.id;
            return (
              <View key={m.id} style={[styles.bubble, isMe && styles.bubbleMe]}>
                {!isMe && <Text style={styles.bubbleSender}>{m.sender_name}</Text>}
                <View style={[styles.bubbleInner, isMe ? styles.bubbleInnerMe : styles.bubbleInnerThem]}>
                  <Text style={[styles.bubbleText, isMe && { color: '#fff' }]}>{m.content}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Message input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.msgInput}
          placeholder="傳送訊息…"
          placeholderTextColor={Colors.ink400}
          value={msgText}
          onChangeText={setMsgText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMsg}>
          <Text style={styles.sendBtnText}>發送</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.ink50 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.ink200 },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.ink100, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 22, color: Colors.ink900, lineHeight: 28 },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.ink900 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, ...Shadows.sm },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between' },
  lineKey: { fontSize: 13, color: Colors.ink500 },
  lineVal: { fontSize: 13, fontWeight: '600', color: Colors.ink900 },
  actionBtn: { backgroundColor: Colors.pink500, borderRadius: 999, paddingVertical: 14, alignItems: 'center', ...Shadows.brand },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink900 },
  noMsg: { fontSize: 13, color: Colors.ink400, textAlign: 'center', paddingVertical: 16 },
  bubble: { marginBottom: 8 },
  bubbleMe: { alignItems: 'flex-end' },
  bubbleSender: { fontSize: 11, color: Colors.ink500, marginBottom: 3, marginLeft: 4 },
  bubbleInner: { maxWidth: '80%', borderRadius: 16, padding: 10, paddingHorizontal: 14 },
  bubbleInnerMe: { backgroundColor: Colors.pink500, borderBottomRightRadius: 4 },
  bubbleInnerThem: { backgroundColor: '#fff', borderBottomLeftRadius: 4, ...Shadows.sm },
  bubbleText: { fontSize: 14, color: Colors.ink900, lineHeight: 20 },
  inputBar: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.ink200 },
  msgInput: { flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: Colors.ink100, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.ink900 },
  sendBtn: { height: 44, width: 60, borderRadius: 22, backgroundColor: Colors.pink500, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
