'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { StarRating } from '@/components/StarRating';
import {
  MapPin, Star, Package, ChevronLeft, ChevronRight,
  Calendar, ShoppingCart, Clock, User, AlertCircle, ShieldCheck, Video
} from 'lucide-react';

interface Product {
  id: number; title: string; description: string; category: string;
  images: string; daily_rent: number; deposit: number; location: string;
  status: string; seller_id: number; seller_name: string;
  seller_rating: number; seller_rating_count: number; seller_bio: string;
  seller_verified: number; available_quantity: number;
  billing_unit?: string;
}

interface Review {
  id: number; rating: number; comment: string; reviewer_name: string; created_at: string;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayFull = new Date().toISOString().slice(0, 16);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data.product);
        setReviews(data.reviews ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const images: string[] = product ? JSON.parse(product.images || '[]') : [];
  const billing_unit = product?.billing_unit ?? 'daily';
  const unitLabel = billing_unit === 'hourly' ? '小時' : billing_unit === 'monthly' ? '月' : '天';

  const periods = (() => {
    if (!startDate || !endDate) return 0;
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    if (billing_unit === 'hourly') return Math.max(0, Math.ceil((endMs - startMs) / 3600000));
    if (billing_unit === 'monthly') {
      const s = new Date(startDate);
      const e = new Date(endDate);
      return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
    }
    return Math.max(0, Math.ceil((endMs - startMs) / 86400000));
  })();

  const totalRent = product ? product.daily_rent * periods : 0;
  const totalAmount = product ? totalRent + product.deposit : 0;

  async function handleOrder() {
    if (!user) { router.push('/login'); return; }
    if (!startDate || !endDate) { setError('請選擇租借日期'); return; }
    if (periods < 1) { setError(billing_unit === 'hourly' ? '結束時間必須晚於開始時間至少1小時' : billing_unit === 'monthly' ? '租借期間至少1個月' : '結束日期必須晚於開始日期'); return; }
    setError('');
    setOrdering(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: product!.id, start_date: startDate, end_date: endDate }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/checkout/${data.order.id}`);
    } catch {
      setError('下單失敗，請稍後再試');
    } finally {
      setOrdering(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square bg-surface rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-surface rounded w-3/4" />
            <div className="h-4 bg-surface rounded w-1/2" />
            <div className="h-24 bg-surface rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-subtle">
        <Package className="w-16 h-16 text-border mb-4" />
        <p className="text-lg text-muted">商品不存在</p>
        <Link href="/" className="mt-4 text-wood hover:underline text-sm">回首頁</Link>
      </div>
    );
  }

  const isOwner = user?.id === product.seller_id;
  const isAvailable = product.status === 'available';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-subtle mb-6">
        <Link href="/" className="hover:text-muted transition-colors">首頁</Link>
        <span>/</span>
        <span className="text-wood">{product.category}</span>
        <span>/</span>
        <span className="text-muted line-clamp-1">{product.title}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Left: Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden mb-3" style={{ background: 'linear-gradient(135deg, #FFF0F4 0%, #F5F3EF 100%)' }}>
            {images.length > 0 ? (
              <img src={images[imgIdx]} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-subtle">
                <Package className="w-20 h-20 text-border" />
                <p className="text-sm mt-3">暫無圖片</p>
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-card/80 backdrop-blur rounded-full flex items-center justify-center border border-border hover:bg-card transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-primary" />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-card/80 backdrop-blur rounded-full flex items-center justify-center border border-border hover:bg-card transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-primary" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-wood' : 'border-transparent'}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Order */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center bg-wood-lt text-wood text-xs font-medium px-2.5 py-1 rounded-full">
              {product.category}
            </span>
            {product.available_quantity !== undefined && isAvailable && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                product.available_quantity > 0
                  ? 'bg-surface text-muted'
                  : 'bg-surface text-subtle'
              }`}>
                {product.available_quantity > 0 ? `剩餘 ${product.available_quantity} 件可租` : '暫無庫存'}
              </span>
            )}
            {!isAvailable && (
              <span className="inline-flex items-center bg-surface text-muted text-xs font-medium px-2.5 py-1 rounded-full">
                {product.status === 'rented' ? '租借中' : '暫停出租'}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-primary mb-3">{product.title}</h1>

          {product.location && (
            <div className="flex items-center gap-1.5 text-muted text-sm mb-4">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {product.location}
            </div>
          )}

          <p className="text-muted text-sm leading-relaxed mb-6">{product.description}</p>

          {/* Pricing */}
          <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-wood">NT${product.daily_rent.toLocaleString()}</span>
              <span className="text-muted">/{unitLabel}</span>
            </div>
            <p className="text-muted text-sm">押金 NT${product.deposit.toLocaleString()}（歸還後退還）</p>
          </div>

          {/* Seller info */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-wood flex items-center justify-center text-white font-bold">
              {product.seller_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm text-primary">{product.seller_name}</p>
                {product.seller_verified === 1 && (
                  <span className="flex items-center gap-0.5 text-[10px] border border-wood/30 bg-wood-lt text-wood px-1.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    認證商家
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-wood-dk fill-wood-dk" />
                <span className="text-sm text-muted">
                  {product.seller_rating > 0 ? `${product.seller_rating.toFixed(1)} (${product.seller_rating_count}則評價)` : '新賣家'}
                </span>
              </div>
            </div>
          </div>

          {/* Handover video notice */}
          <div className="bg-wood-lt border border-wood/30 rounded-xl p-4 mb-4 text-sm">
            <div className="flex items-start gap-2.5">
              <Video className="w-4 h-4 text-wood-dk mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-primary mb-1">面交驗貨請錄影</p>
                <p className="text-muted leading-relaxed">
                  面交時請雙方<strong className="text-primary">同步錄影測試商品所有功能</strong>，確認正常運作後再交付。
                  租借方與出借方各自上傳驗貨影片後，租借計時才正式開始。
                </p>
                <p className="text-wood-dk font-medium mt-1.5">
                  未完成影片上傳，視為自動放棄平台損害賠償保障。
                </p>
              </div>
            </div>
          </div>

          {/* Order form */}
          {!isOwner && isAvailable && (product.available_quantity === undefined || product.available_quantity > 0) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-muted mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {billing_unit === 'hourly' ? '開始時間' : '開始日期'}
                  </label>
                  <input
                    type={billing_unit === 'hourly' ? 'datetime-local' : 'date'}
                    value={startDate}
                    min={billing_unit === 'hourly' ? todayFull : today}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="muji-input w-full"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-muted mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {billing_unit === 'hourly' ? '結束時間' : '結束日期'}
                  </label>
                  <input
                    type={billing_unit === 'hourly' ? 'datetime-local' : 'date'}
                    value={endDate}
                    min={startDate || (billing_unit === 'hourly' ? todayFull : today)}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="muji-input w-full"
                  />
                </div>
              </div>

              {periods > 0 && (
                <div className="rounded-xl border-[1.5px] border-border overflow-hidden text-sm">
                  <div className="px-4 py-3 space-y-2.5">
                    <div className="flex justify-between items-center text-muted">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 租期</span>
                      <span className="font-medium text-primary">{periods} {unitLabel}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted">
                      <span>NT${product.daily_rent.toLocaleString()} × {periods} {unitLabel}</span>
                      <span>NT${totalRent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted">
                      <span>平台手續費 (5%)</span>
                      <span>NT${Math.round(totalRent * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted">
                      <span>押金（歸還後退還）</span>
                      <span>NT${product.deposit.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center font-bold px-4 py-3 bg-surface border-t-[1.5px] border-border">
                    <span className="text-primary">總計付款</span>
                    <span className="text-wood text-lg">NT${totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2.5 bg-wood-lt border-t border-wood/15 text-xs text-wood-dk flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>押金為最高賠償上限，面交時請雙方錄影存證，完成上傳後計時開始</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleOrder}
                disabled={ordering}
                className="w-full bg-wood hover:bg-wood-h text-white py-3 rounded-full font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                {ordering ? '處理中...' : user ? '立即租借' : '登入後租借'}
              </button>
            </div>
          )}

          {!isOwner && isAvailable && product.available_quantity === 0 && (
            <div className="bg-surface border border-border rounded-xl p-4 text-sm text-muted text-center">
              此商品目前無可用庫存，請稍後再試
            </div>
          )}

          {isOwner && (
            <div className="bg-wood-lt border border-wood/20 rounded-xl p-4 text-sm text-wood-dk flex items-center gap-2">
              <User className="w-4 h-4 flex-shrink-0" />
              這是您的商品。
              <Link href="/my/listings" className="underline font-medium">前往管理</Link>
            </div>
          )}

          {!isAvailable && !isOwner && (
            <div className="bg-surface border border-border rounded-xl p-4 text-sm text-muted text-center">
              此商品目前{product.status === 'rented' ? '已被租借中' : '暫停出租'}，請稍後再試
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-wood-dk fill-wood-dk" />
          租借評價 ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-subtle">
            <Star className="w-10 h-10 text-border mx-auto mb-3" />
            <p>還沒有評價，成為第一個評價的人！</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-wood-lt flex items-center justify-center text-wood text-sm font-bold">
                      {r.reviewer_name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-primary">{r.reviewer_name}</span>
                  </div>
                  <StarRating rating={r.rating} size="sm" />
                </div>
                {r.comment && <p className="text-sm text-muted leading-relaxed">{r.comment}</p>}
                <p className="text-xs text-subtle mt-3">{new Date(r.created_at).toLocaleDateString('zh-TW')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
