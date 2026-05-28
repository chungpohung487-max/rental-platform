import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Shadows } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/auth';

const { width } = Dimensions.get('window');

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  images: string;
  daily_rent: number;
  deposit: number;
  location: string;
  seller_id: number;
  seller_name: string;
  seller_rating: number;
  seller_rating_count: number;
  seller_verified: number;
  available_quantity: number;
  estimated_value?: number;
  billing_unit?: string;
}

const CAT_COLORS: Record<string, string> = {
  '電子產品': Colors.catSky, '工具設備': Colors.catCream,
  '戶外運動': Colors.catLeaf, '影音設備': Colors.catSky,
  '服裝配件': Colors.catLavender, '家居家具': Colors.catClay,
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/products/${id}`)
      .then(r => r.json())
      .then(d => setProduct(d.product ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleBook() {
    if (!user) { router.push('/login'); return; }
    if (!product) return;
    if (product.seller_id === user.id) {
      Alert.alert('提示', '無法租借自己的商品');
      return;
    }
    if (product.available_quantity === 0) {
      Alert.alert('提示', '此商品目前已全部出租');
      return;
    }

    // Simple: create order with today + 1 day
    const start = new Date();
    const end = new Date(start.getTime() + 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    setBooking(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: product.id, start_date: fmt(start), end_date: fmt(end) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '建立訂單失敗');
      router.push(`/checkout/${data.order.id}`);
    } catch (e: any) {
      Alert.alert('錯誤', e.message);
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.pink500} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>📦</Text>
          <Text style={{ color: Colors.ink500, marginTop: 12 }}>商品不存在</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const unitLabel = product.billing_unit === 'hourly' ? '小時' : product.billing_unit === 'monthly' ? '月' : '天';
  const bg = CAT_COLORS[product.category] ?? Colors.pink100;
  const isSoldOut = product.available_quantity === 0;
  const isOwn = user?.id === product.seller_id;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Image */}
        <View style={[styles.heroImg, { backgroundColor: bg }]}>
          {/* Overlay buttons */}
          <SafeAreaView edges={['top']} style={styles.imgOverlay}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
              <Text style={{ fontSize: 20, color: Colors.ink900 }}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={() => setLiked(v => !v)}>
              <Text style={{ fontSize: 18, color: liked ? Colors.pink500 : Colors.ink500 }}>{liked ? '♥' : '♡'}</Text>
            </TouchableOpacity>
          </SafeAreaView>
          <Text style={styles.heroEmoji}>📦</Text>
        </View>

        <View style={styles.body}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            {product.seller_verified === 1 && (
              <View style={styles.badge}><Text style={styles.badgeText}>認證公司</Text></View>
            )}
            <View style={styles.badgeDark}><Text style={styles.badgeDarkText}>{product.category}</Text></View>
          </View>

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.metaRow}>
            {product.seller_rating > 0 && (
              <>
                <Text style={styles.rating}>★ {product.seller_rating.toFixed(1)}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{product.seller_rating_count} 評價</Text>
                <Text style={styles.metaDot}>·</Text>
              </>
            )}
            <Text style={styles.metaText}>{product.location}</Text>
          </View>

          {/* Host card */}
          <View style={styles.hostCard}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostAvatarText}>{product.seller_name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hostName}>{product.seller_name}</Text>
              <Text style={styles.hostMeta}>
                {product.seller_rating > 0 ? `★ ${product.seller_rating.toFixed(1)} 評分` : '新出租者'}
              </Text>
            </View>
            <TouchableOpacity style={styles.msgBtn}>
              <Text style={styles.msgBtnText}>傳訊息</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>關於這個物品</Text>
          <Text style={styles.desc}>{product.description || '暫無詳細說明。'}</Text>

          {/* Details */}
          <Text style={styles.sectionTitle}>租借詳情</Text>
          <View style={styles.detailGrid}>
            {[
              ['押金', `NT$ ${product.deposit.toLocaleString()}`],
              ['庫存', `${product.available_quantity} 件`],
              ['計費單位', unitLabel],
              ...(product.estimated_value ? [['估值', `NT$ ${product.estimated_value.toLocaleString()}`]] : []),
            ].map(([k, v]) => (
              <View key={k} style={styles.detailItem}>
                <Text style={styles.detailKey}>{k}</Text>
                <Text style={styles.detailVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']}>
          <View style={styles.bottomInner}>
            <View>
              <Text style={styles.bottomPrice}>
                NT$ {product.daily_rent.toLocaleString()}
                <Text style={styles.bottomUnit}> /{unitLabel}</Text>
              </Text>
              <Text style={styles.bottomDeposit}>押金 NT$ {product.deposit.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={[styles.bookBtn, (isSoldOut || isOwn) && styles.bookBtnDisabled]}
              onPress={handleBook}
              disabled={isSoldOut || isOwn || booking}
            >
              {booking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookBtnText}>
                  {isOwn ? '你的商品' : isSoldOut ? '已出租' : '選擇日期 / 立即租借'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backLink: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: Colors.ink200 },
  backLinkText: { color: Colors.ink700, fontWeight: '600' },

  heroImg: {
    width, aspectRatio: 4/3.5,
    alignItems: 'center', justifyContent: 'center',
  },
  imgOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', padding: 16,
  },
  circleBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,.95)',
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.sm,
  },
  heroEmoji: { fontSize: 52 },

  body: { padding: 20 },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.pink500 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  badgeDark: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.ink900 },
  badgeDarkText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  title: { fontSize: 22, fontWeight: '800', color: Colors.ink900, lineHeight: 28, marginBottom: 8 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  rating: { fontSize: 12, color: Colors.pink600, fontWeight: '700' },
  metaDot: { color: Colors.ink400, fontSize: 12 },
  metaText: { fontSize: 12, color: Colors.ink500 },

  hostCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.ink200, borderRadius: 16, marginBottom: 24,
  },
  hostAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.pink500, alignItems: 'center', justifyContent: 'center',
  },
  hostAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  hostName: { fontSize: 14, fontWeight: '700', color: Colors.ink900 },
  hostMeta: { fontSize: 11, color: Colors.ink500, marginTop: 2 },
  msgBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.ink900 },
  msgBtnText: { fontSize: 12, fontWeight: '700', color: Colors.ink900 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.ink900, marginBottom: 8, marginTop: 4 },
  desc: { fontSize: 13, lineHeight: 20, color: Colors.ink700, marginBottom: 20 },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  detailItem: { flex: 1, minWidth: '45%', backgroundColor: Colors.ink50, borderRadius: 12, padding: 14 },
  detailKey: { fontSize: 11, color: Colors.ink500, marginBottom: 4 },
  detailVal: { fontSize: 15, fontWeight: '700', color: Colors.ink900 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.ink200,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 12,
  },
  bottomInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 12 },
  bottomPrice: { fontSize: 18, fontWeight: '800', color: Colors.ink900 },
  bottomUnit: { fontSize: 12, fontWeight: '400', color: Colors.ink500 },
  bottomDeposit: { fontSize: 11, color: Colors.ink500, marginTop: 2 },
  bookBtn: {
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999,
    backgroundColor: Colors.pink500, ...Shadows.brand,
  },
  bookBtnDisabled: { backgroundColor: Colors.ink300, shadowOpacity: 0 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
