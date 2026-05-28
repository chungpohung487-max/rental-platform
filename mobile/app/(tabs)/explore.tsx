import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadows } from '@/constants/colors';
import { API_URL } from '@/constants/api';

interface Product {
  id: number;
  title: string;
  daily_rent: number;
  location: string;
  seller_rating: number;
  images: string;
  category: string;
  billing_unit?: string;
  available_quantity: number;
}

const CAT_COLORS: Record<string, string> = {
  '電子產品': Colors.catSky, '工具設備': Colors.catCream,
  '戶外運動': Colors.catLeaf, '影音設備': Colors.catSky,
  '服裝配件': Colors.catLavender, '家居家具': Colors.catClay,
};

export default function ExploreScreen() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/products?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.products ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const unitLabel = (u?: string) => u === 'hourly' ? '小時' : u === 'monthly' ? '月' : '天';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Search bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="搜尋相機、帳篷、投影機…"
            placeholderTextColor={Colors.ink400}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => search(q)}
            returnKeyType="search"
            autoFocus
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => { setQ(''); setResults([]); setSearched(false); }}>
              <Text style={{ fontSize: 16, color: Colors.ink400, paddingRight: 12 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => search(q)}>
          <Text style={styles.searchBtn}>搜尋</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={Colors.pink500} />
      ) : !searched ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🔍</Text>
          <Text style={styles.placeholderText}>輸入關鍵字開始搜尋</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📦</Text>
          <Text style={styles.placeholderText}>找不到「{q}」相關商品</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item: p }) => (
            <TouchableOpacity style={styles.row} onPress={() => router.push(`/products/${p.id}`)}>
              <View style={[styles.rowImg, { backgroundColor: CAT_COLORS[p.category] ?? Colors.pink100 }]}>
                <Text style={{ fontSize: 28 }}>📦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={2}>{p.title}</Text>
                <Text style={styles.rowMeta}>
                  {p.seller_rating > 0 ? `★ ${p.seller_rating.toFixed(1)} · ` : ''}{p.location}
                </Text>
                <Text style={styles.rowPrice}>
                  NT$ {p.daily_rent.toLocaleString()}
                  <Text style={styles.rowUnit}> /{unitLabel(p.billing_unit)}</Text>
                </Text>
              </View>
              <Text style={{ color: Colors.ink300, fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.ink50 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.ink200,
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.ink100, borderRadius: 999,
    paddingHorizontal: 14, height: 44,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: Colors.ink900 },
  searchBtn: { color: Colors.pink600, fontWeight: '700', fontSize: 15 },

  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  placeholderIcon: { fontSize: 48 },
  placeholderText: { fontSize: 15, color: Colors.ink500, fontWeight: '500' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    ...Shadows.sm,
  },
  rowImg: {
    width: 70, height: 70, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: Colors.ink900, marginBottom: 3 },
  rowMeta: { fontSize: 11, color: Colors.ink500, marginBottom: 4 },
  rowPrice: { fontSize: 16, fontWeight: '800', color: Colors.ink900 },
  rowUnit: { fontSize: 11, fontWeight: '400', color: Colors.ink500 },
});
