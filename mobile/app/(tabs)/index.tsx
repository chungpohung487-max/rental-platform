'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadows } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/auth';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;

const CATEGORIES = [
  { name: '3C 電子',  bg: Colors.catSky,      emoji: '📷' },
  { name: '戶外露營', bg: Colors.catLeaf,      emoji: '⛺' },
  { name: '派對活動', bg: Colors.pink200,      emoji: '🎉' },
  { name: '運動健身', bg: Colors.catCream,     emoji: '🚴' },
  { name: '嬰幼兒',   bg: Colors.catLavender, emoji: '🍼' },
  { name: '時尚配件', bg: Colors.catClay,      emoji: '👗' },
] as const;

interface Product {
  id: number;
  title: string;
  daily_rent: number;
  deposit: number;
  location: string;
  seller_name: string;
  seller_rating: number;
  seller_rating_count: number;
  seller_verified: number;
  available_quantity: number;
  images: string;
  category: string;
  billing_unit?: string;
}

function ProductCard({ product }: { product: Product }) {
  const images: string[] = JSON.parse(product.images || '[]');
  const unitLabel = product.billing_unit === 'hourly' ? '小時' : product.billing_unit === 'monthly' ? '月' : '天';
  const catColors: Record<string, string> = {
    '電子產品': Colors.catSky, '工具設備': Colors.catCream,
    '戶外運動': Colors.catLeaf, '影音設備': Colors.catSky,
    '服裝配件': Colors.catLavender, '家居家具': Colors.catClay,
  };
  const bg = catColors[product.category] ?? Colors.pink100;

  return (
    <TouchableOpacity style={[styles.card, { width: CARD_W }]} onPress={() => router.push(`/products/${product.id}`)}>
      <View style={[styles.cardImg, { backgroundColor: bg }]}>
        {!images[0] && <Text style={styles.cardEmoji}>📦</Text>}
        <View style={styles.heartBtn}>
          <Text style={{ fontSize: 14, color: Colors.ink400 }}>♡</Text>
        </View>
        {product.available_quantity === 0 && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>已出租</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.cardMeta}>
          {product.seller_rating > 0 ? `★ ${product.seller_rating.toFixed(1)} · ` : ''}{product.location}
        </Text>
        <Text style={styles.cardPrice}>
          NT$ {product.daily_rent.toLocaleString()}
          <Text style={styles.cardUnit}> /{unitLabel}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');

  const fetchProducts = useCallback(async (query = '', cat = '') => {
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (cat) params.set('category', cat);
      const res = await fetch(`${API_URL}/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function handleSearch() {
    setLoading(true);
    fetchProducts(q, selectedCat);
  }

  function handleCat(name: string) {
    const next = selectedCat === name ? '' : name;
    setSelectedCat(next);
    setLoading(true);
    fetchProducts(q, next);
  }

  function onRefresh() {
    setRefreshing(true);
    fetchProducts(q, selectedCat);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pink500} />}
      >
        {/* ── Header ─────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.locRow}>
              <Text style={styles.locPin}>📍</Text>
              <Text style={styles.locText}>台北市</Text>
            </View>
            <TouchableOpacity onPress={() => user ? router.push('/me') : router.push('/login')}>
              {user ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                </View>
              ) : (
                <View style={styles.loginBtn}>
                  <Text style={styles.loginBtnText}>登入</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>
            想用，{'\n'}不一定要<Text style={{ color: Colors.pink500 }}>買。</Text>
          </Text>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="搜尋相機、帳篷、投影機…"
              placeholderTextColor={Colors.ink400}
              value={q}
              onChangeText={setQ}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>搜尋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Categories ─────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.name}
              style={styles.catItem}
              onPress={() => handleCat(cat.name)}
            >
              <View style={[styles.catCircle, { backgroundColor: cat.bg }, selectedCat === cat.name && styles.catCircleActive]}>
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
              </View>
              <Text style={[styles.catLabel, selectedCat === cat.name && { color: Colors.pink600 }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Listings ───────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCat ? selectedCat : '本週熱門'}
            </Text>
            {!selectedCat && <Text style={styles.sectionMore}>查看全部</Text>}
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.pink500} style={{ marginTop: 32 }} />
          ) : products.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>找不到相關商品</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.ink50 },

  // Header
  header: {
    backgroundColor: Colors.pink50,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18,
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locPin: { fontSize: 14 },
  locText: { fontSize: 13, fontWeight: '600', color: Colors.ink700 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.pink500, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  loginBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    backgroundColor: Colors.pink500,
  },
  loginBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  heroTitle: {
    fontSize: 32, fontWeight: '900', lineHeight: 38, color: Colors.ink900, marginBottom: 20,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 999, paddingLeft: 18, paddingRight: 6, height: 50,
    ...Shadows.md,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.ink900 },
  searchBtn: {
    height: 38, paddingHorizontal: 18, borderRadius: 999,
    backgroundColor: Colors.pink500, alignItems: 'center', justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Categories
  catRow: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
  catItem: { alignItems: 'center', width: 68 },
  catCircle: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  catCircleActive: { borderWidth: 2, borderColor: Colors.pink600 },
  catEmoji: { fontSize: 26 },
  catLabel: { fontSize: 11, fontWeight: '600', color: Colors.ink700, textAlign: 'center' },

  // Listings
  section: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: Colors.ink900 },
  sectionMore: { fontSize: 13, fontWeight: '600', color: Colors.pink700 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // Product card
  card: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    marginBottom: 4, ...Shadows.sm,
  },
  cardImg: {
    width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 36 },
  heartBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  soldBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(31,26,28,.65)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  soldBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBody: { padding: 10, paddingBottom: 12 },
  cardTitle: { fontWeight: '600', fontSize: 12, color: Colors.ink900, lineHeight: 16, marginBottom: 3 },
  cardMeta: { fontSize: 10, color: Colors.ink500, marginBottom: 5 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: Colors.ink900 },
  cardUnit: { fontSize: 10, fontWeight: '400', color: Colors.ink500 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: Colors.ink500 },
});
