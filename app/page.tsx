'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ProductCard } from '@/components/ProductCard';
import { Search, SlidersHorizontal, Package, Map } from 'lucide-react';

const LeafletMap = dynamic(() => import('@/components/LeafletMap').then(m => m.LeafletMap), {
  ssr: false,
  loading: () => <div className="h-96 bg-surface rounded-2xl flex items-center justify-center text-muted text-sm">地圖載入中...</div>,
});

const CATEGORIES = ['全部', '電子產品', '工具設備', '戶外運動', '影音設備', '服裝配件', '家居家具', '書籍文具', '其他'];

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  images: string;
  daily_rent: number;
  deposit: number;
  location: string;
  seller_name: string;
  seller_rating: number;
  seller_rating_count: number;
  seller_verified: number;
  available_quantity: number;
  latitude: number | null;
  longitude: number | null;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [area, setArea] = useState(searchParams.get('area') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') ?? '');
  const [billingUnit, setBillingUnit] = useState(searchParams.get('billing_unit') ?? '');

  const hasActiveFilters = !!(area || minPrice || maxPrice || billingUnit);

  const fetchProducts = useCallback(async (q: string, cat: string, ar: string, minP: string, maxP: string, bu: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (cat) params.set('category', cat);
      if (ar) params.set('area', ar);
      if (minP) params.set('min_price', minP);
      if (maxP) params.set('max_price', maxP);
      if (bu) params.set('billing_unit', bu);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    const cat = searchParams.get('category') ?? '';
    const ar = searchParams.get('area') ?? '';
    const minP = searchParams.get('min_price') ?? '';
    const maxP = searchParams.get('max_price') ?? '';
    const bu = searchParams.get('billing_unit') ?? '';
    setSearchQ(q); setCategory(cat); setArea(ar);
    setMinPrice(minP); setMaxPrice(maxP); setBillingUnit(bu);
    fetchProducts(q, cat, ar, minP, maxP, bu);
  }, [searchParams, fetchProducts]);

  function buildParams(overrides: Record<string, string> = {}) {
    const base: Record<string, string> = {};
    if (searchQ) base.q = searchQ;
    if (category) base.category = category;
    if (area) base.area = area;
    if (minPrice) base.min_price = minPrice;
    if (maxPrice) base.max_price = maxPrice;
    if (billingUnit) base.billing_unit = billingUnit;
    return new URLSearchParams({ ...base, ...overrides }).toString();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/?${buildParams()}`);
  }

  function handleApplyFilters() {
    router.push(`/?${buildParams()}`);
    setShowFilters(false);
  }

  function handleClearFilters() {
    setArea(''); setMinPrice(''); setMaxPrice(''); setBillingUnit('');
    const params = new URLSearchParams();
    if (searchQ) params.set('q', searchQ);
    if (category) params.set('category', category);
    router.push(`/?${params.toString()}`);
    setShowFilters(false);
  }

  function handleCategory(cat: string) {
    const newCat = cat === '全部' ? '' : cat;
    router.push(`/?${buildParams({ category: newCat })}`);
  }

  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border" style={{ background: 'var(--bg)' }}>
        {/* Radial pink glow — top-right */}
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full" style={{ background: 'radial-gradient(circle, var(--pink-200) 0%, transparent 60%)', filter: 'blur(20px)', opacity: 0.55 }} />

        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy + search */}
          <div>
            <div className="zx-eyebrow mb-4">· 全台灣租借交易平台 ·</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(40px,5vw,64px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
              想用，<br />不一定要<span style={{ color: 'var(--wood)' }}>買。</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed max-w-md" style={{ color: 'var(--muted)' }}>
              從相機到帳篷，從派對音響到嬰兒推車。找到你需要的，出租你閒置的。
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mt-8 flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="搜尋相機、帳篷、投影機…"
                  className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-full text-sm text-primary placeholder:text-subtle focus:outline-none focus:border-wood focus:ring-2 focus:ring-wood/10 transition-all"
                  style={{ boxShadow: 'var(--shadow-md)' }}
                />
              </div>
              <button
                type="submit"
                className="bg-wood hover:bg-wood-h text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
                style={{ boxShadow: 'var(--shadow-brand)' }}
              >
                搜尋
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-full text-sm font-medium border transition-colors ${hasActiveFilters ? 'bg-wood text-white border-wood' : 'bg-card border-border text-muted hover:border-wood hover:text-wood'}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                篩選{hasActiveFilters ? ` (${[area, minPrice || maxPrice ? '價格' : '', billingUnit].filter(Boolean).length})` : ''}
              </button>
            </form>

            {/* Quick category tags */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {['相機', '帳篷', '投影機', '電動滑板', '派對音響'].map(tag => (
                <button
                  key={tag}
                  onClick={() => router.push(`/?q=${encodeURIComponent(tag)}`)}
                  className="px-4 py-1.5 rounded-full text-sm border transition-colors"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--wood)'; (e.currentTarget as HTMLElement).style.color = 'var(--wood)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Trust row */}
            <div className="flex gap-6 mt-6 text-sm" style={{ color: 'var(--muted)' }}>
              {[['押金保障', '🛡'], ['身分驗證', '✓'], ['3 小時內回覆', '💬']].map(([label, icon]) => (
                <span key={label} className="flex items-center gap-1.5 font-medium">
                  <span>{icon}</span> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right — decorative collage */}
          <div className="hidden lg:block relative" style={{ height: 440 }}>
            {[
              { top: 20, left: 60, w: 200, h: 260, bg: 'linear-gradient(135deg,#9BC68A,#5B8C45)', label: '戶外露營', rot: -5 },
              { top: 40, left: 270, w: 185, h: 220, bg: 'linear-gradient(135deg,#FFC9D6,#EC6788)', label: '派對活動', rot: 4 },
              { top: 265, left: 30, w: 170, h: 200, bg: 'linear-gradient(135deg,#A8D0E6,#3A7BD5)', label: '3C 電子', rot: 5 },
              { top: 285, left: 240, w: 200, h: 185, bg: 'linear-gradient(135deg,#FBE7B6,#D98C2A)', label: '戶外活動', rot: -3 },
            ].map(({ top, left, w, h, bg, label, rot }) => (
              <div key={label} style={{
                position: 'absolute', top, left, width: w, height: h,
                background: bg, borderRadius: 24, transform: `rotate(${rot}deg)`,
                boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'flex-end', padding: 14, overflow: 'hidden',
              }}>
                <span style={{ background: 'rgba(0,0,0,.35)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{label}</span>
              </div>
            ))}
            {/* Floating price card */}
            <div style={{
              position: 'absolute', top: 205, left: 185, zIndex: 10,
              background: 'var(--card)', borderRadius: 16, padding: '12px 18px',
              boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--subtle)', fontWeight: 600 }}>GoPro Hero 12</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>NT$ 480 <span style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 400 }}>/ 日</span></div>
              <div style={{ fontSize: 11, color: 'var(--wood-dk)', fontWeight: 700, marginTop: 2 }}>★ 4.9 · 已驗證</div>
            </div>
          </div>
        </div>

        {/* Filter panel — below the grid */}
        {showFilters && (
          <div className="max-w-7xl mx-auto px-6 pb-6">
            <div className="max-w-xl bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">地區</label>
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="例：台北市、板橋"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary placeholder:text-subtle focus:outline-none focus:border-wood transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">計費單位</label>
                  <div className="flex gap-1.5">
                    {[['', '全部'], ['hourly', '小時'], ['daily', '天'], ['monthly', '月']].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBillingUnit(val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${billingUnit === val ? 'bg-wood text-white border-wood' : 'bg-surface text-muted border-border hover:border-wood hover:text-wood'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">租金範圍 (NT$/計費單位)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="最低" min="0" className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary placeholder:text-subtle focus:outline-none focus:border-wood transition-all" />
                  <span className="text-muted text-sm">—</span>
                  <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="最高" min="0" className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary placeholder:text-subtle focus:outline-none focus:border-wood transition-all" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleClearFilters} className="flex-1 py-2 border border-border rounded-lg text-sm text-muted font-medium hover:bg-surface transition-colors">清除篩選</button>
                <button type="button" onClick={handleApplyFilters} className="flex-[2] py-2 bg-wood hover:bg-wood-h text-white rounded-lg text-sm font-medium transition-colors">套用篩選</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map section */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <button
          onClick={() => setShowMap((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-wood hover:text-wood-h transition-colors mb-3"
        >
          <Map className="w-4 h-4" />
          {showMap ? '隱藏地圖' : '顯示附近商品地圖'}
        </button>
        {showMap && (
          <div className="mb-6">
            <LeafletMap products={products.filter(p => p.latitude && p.longitude).map(p => ({
              id: p.id,
              title: p.title,
              daily_rent: p.daily_rent,
              latitude: p.latitude!,
              longitude: p.longitude!,
              available_quantity: p.available_quantity,
            }))} />
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="bg-card border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1.5 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const isActive = (cat === '全部' && !category) || cat === category;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-wood text-white shadow-sm'
                      : 'bg-surface text-muted hover:text-primary hover:bg-border'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-muted text-sm flex-wrap">
            {loading ? '載入中...' : `共 ${products.length} 件商品`}
            {(searchQ || category || hasActiveFilters) && (
              <span className="text-wood-dk font-medium">
                {searchQ && `「${searchQ}」`}
                {category && ` · ${category}`}
                {area && ` · ${area}`}
                {(minPrice || maxPrice) && ` · NT$${minPrice || '0'}–${maxPrice || '∞'}`}
                {billingUnit && ` · ${billingUnit === 'hourly' ? '按小時' : billingUnit === 'monthly' ? '按月' : '按天'}`}
              </span>
            )}
          </div>
          {(searchQ || category || hasActiveFilters) && (
            <button
              onClick={() => router.push('/')}
              className="text-sm text-subtle hover:text-muted transition-colors"
            >
              清除全部
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="aspect-video" style={{ background: 'linear-gradient(135deg, #FFF0F4 0%, #F5F3EF 100%)' }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-surface rounded w-3/4" />
                  <div className="h-3 bg-surface rounded" />
                  <div className="h-3 bg-surface rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-subtle">
            <Package className="w-16 h-16 text-border mb-4" />
            <p className="text-lg font-medium text-muted">找不到相關商品</p>
            <p className="text-sm mt-1">試試不同的關鍵字或分類</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="px-6 py-24" style={{ background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-14">
            <div className="zx-eyebrow mb-3">三步驟，輕鬆完成</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px,3.5vw,42px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: 'var(--text)', margin: 0 }}>
              從找到，到歸還，<br />不超過 5 分鐘的事。
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', title: '找到你想要的', desc: '搜尋、瀏覽、比較價格與評價。', bg: 'var(--pink-100)' },
              { num: '02', title: '預訂並付款',   desc: '選擇日期、線上付款、押金保障。', bg: 'var(--pink-200)' },
              { num: '03', title: '取件、使用、歸還', desc: '面交或宅配，使用完歸還即可。', bg: 'var(--pink-300)' },
            ].map(({ num, title, desc, bg }) => (
              <div key={num} className="relative overflow-hidden rounded-3xl p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div aria-hidden className="absolute -top-8 -right-8 w-36 h-36 rounded-full" style={{ background: bg, opacity: 0.65 }} />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7" style={{ background: 'var(--text)', color: '#fff' }}>
                    <span className="text-xl font-bold">{num === '01' ? '🔍' : num === '02' ? '📅' : '📦'}</span>
                  </div>
                  <div className="font-mono text-xs mb-1.5" style={{ color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }}>STEP {num}</div>
                  <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Become a Lister ───────────────────────────────── */}
      <section className="px-6 pb-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto">
          <div
            className="relative overflow-hidden rounded-[32px] p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            style={{ background: '#1F1A1C', color: '#fff' }}
          >
            {/* Pink halo glow */}
            <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-24 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(236,103,136,.5) 0%, transparent 60%)', filter: 'blur(40px)' }} />

            <div className="relative">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-5" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', color: 'var(--pink-300, #FFA8BD)' }}>
                · 出租者 ·
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(32px,3.5vw,52px)', lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0 }}>
                家裡的閒置物，<br />每月多賺 <span style={{ color: 'var(--pink-400, #F587A0)' }}>NT$ 8,000</span>。
              </h2>
              <p className="mt-5 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,.75)' }}>
                一台閒置的相機、一頂只用過兩次的帳篷，都能變成穩定的被動收入。我們提供身分驗證、押金保障。
              </p>
              <div className="flex gap-4 mt-8 flex-wrap">
                <a
                  href="/products/new"
                  className="inline-flex items-center px-7 py-4 rounded-full font-bold text-white text-sm"
                  style={{ background: 'var(--wood)', boxShadow: 'var(--shadow-brand)' }}
                >
                  立即上架第一件商品
                </a>
              </div>
            </div>

            {/* Earnings illustration */}
            <div className="hidden lg:block relative" style={{ height: 280 }}>
              <div style={{
                position: 'absolute', top: 20, left: 20, padding: '20px 24px',
                background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
                borderRadius: 20, backdropFilter: 'blur(10px)', width: 220, transform: 'rotate(-3deg)',
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>本月收入</div>
                <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>NT$ 8,240</div>
                <div style={{ fontSize: 12, color: 'var(--pink-300, #FFA8BD)', fontWeight: 700, marginTop: 4 }}>↑ 比上月 +18%</div>
              </div>
              <div style={{
                position: 'absolute', top: 170, left: 90, padding: '14px 18px',
                background: 'var(--wood)', borderRadius: 18, width: 210, transform: 'rotate(4deg)',
                boxShadow: '0 20px 40px rgba(236,103,136,.4)',
              }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pink-600)', fontWeight: 800, fontSize: 15 }}>★</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>+1 五星評價</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.8)' }}>「相機保養得很好！」</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
