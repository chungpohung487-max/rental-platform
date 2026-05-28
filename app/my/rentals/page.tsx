'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { StarRating } from '@/components/StarRating';
import { OrderProgress } from '@/components/OrderProgress';
import { ChatWindow } from '@/components/ChatWindow';
import {
  Package, Calendar, MapPin, CheckCircle2, XCircle, Clock, Star,
  MessageCircle, Upload, AlertTriangle, ShieldAlert,
} from 'lucide-react';

interface Order {
  id: number; product_title: string; product_images: string; product_location: string;
  start_date: string; end_date: string; days: number;
  total_rent: number; deposit: number; total_amount: number; platform_fee: number;
  status: string; seller_name: string; seller_id: number; buyer_reviewed: number;
  buyer_confirmed: number; seller_confirmed: number;
  handover_buyer_photos: string; handover_seller_photos: string;
  return_buyer_photos: string; late_fee: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: '待付款',     color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: '待確認租借', color: 'bg-blue-100 text-blue-700' },
  handover:  { label: '面交驗貨',   color: 'bg-purple-100 text-purple-700' },
  active:    { label: '租借中',     color: 'bg-green-100 text-green-700' },
  returning: { label: '歸還確認中', color: 'bg-orange-100 text-orange-700' },
  disputed:  { label: '押金凍結',   color: 'bg-red-100 text-red-700' },
  completed: { label: '已完成',     color: 'bg-surface text-subtle' },
  cancelled: { label: '已取消',     color: 'bg-surface text-subtle' },
};

export default function MyRentalsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingOrder, setReviewingOrder] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [chatOrder, setChatOrder] = useState<{ id: number; name: string } | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/orders?role=buyer', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    fetchOrders();
  }, [user, authLoading, router, fetchOrders]);

  async function handleCancel(orderId: number) {
    if (!confirm('確認取消此訂單？')) return;
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    if (res.ok) fetchOrders();
  }

  async function handleConfirm(orderId: number) {
    const res = await fetch(`/api/orders/${orderId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchOrders();
  }

  async function handleHandoverUpload(orderId: number, files: FileList) {
    setUploadingId(orderId);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        const d = await r.json();
        if (r.ok) urls.push(d.url);
      }
      if (urls.length > 0) {
        await fetch(`/api/orders/${orderId}/handover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ media: urls }),
        });
        fetchOrders();
      }
    } finally {
      setUploadingId(null);
    }
  }

  async function handleReturnUpload(orderId: number, files: FileList) {
    setUploadingId(orderId);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        const d = await r.json();
        if (r.ok) urls.push(d.url);
      }
      if (urls.length > 0) {
        await fetch(`/api/orders/${orderId}/return`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ media: urls }),
        });
        fetchOrders();
      }
    } finally {
      setUploadingId(null);
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewingOrder) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_id: reviewingOrder, rating, comment }),
      });
      if (res.ok) { setReviewingOrder(null); setRating(5); setComment(''); fetchOrders(); }
    } finally { setSubmittingReview(false); }
  }

  function getOverdueDays(endDate: string) {
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((today.getTime() - end.getTime()) / 86400000));
  }

  function getLateFeeRate(days: number) {
    if (days >= 7) return 100;
    if (days >= 3) return 50;
    if (days >= 1) return 10;
    return 0;
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
            <div className="h-5 bg-surface rounded w-1/2 mb-4" />
            <div className="h-3 bg-surface rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary">我的租借</h1>
        <Link href="/" className="text-sm text-wood hover:underline">繼續瀏覽商品</Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center text-subtle">
          <Package className="w-14 h-14 text-border mx-auto mb-4" />
          <p className="text-lg font-medium text-muted">尚無租借紀錄</p>
          <p className="text-sm mt-1 mb-6">快去首頁找找有趣的商品吧！</p>
          <Link href="/" className="bg-wood hover:bg-wood-h text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
            瀏覽商品
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const images: string[] = JSON.parse(order.product_images || '[]');
            const status = STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-surface text-subtle' };
            const overdueDays = order.status === 'active' ? getOverdueDays(order.end_date) : 0;
            const lateFeeRate = getLateFeeRate(overdueDays);
            const buyerPhotos: string[] = JSON.parse(order.handover_buyer_photos || '[]');
            const sellerPhotos: string[] = JSON.parse(order.handover_seller_photos || '[]');

            return (
              <div key={order.id} className="bg-card border border-border rounded-2xl p-6">
                {/* Progress bar */}
                {order.status !== 'pending' && order.status !== 'cancelled' && (
                  <div className="mb-5 pb-5 border-b border-border">
                    <OrderProgress
                      status={order.status}
                      buyerConfirmed={order.buyer_confirmed}
                      sellerConfirmed={order.seller_confirmed}
                      handoverBuyerPhotos={order.handover_buyer_photos}
                      handoverSellerPhotos={order.handover_seller_photos}
                    />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-wood-lt rounded-xl overflow-hidden flex-shrink-0">
                    {images[0] ? (
                      <img src={images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-7 h-7 text-border" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="font-semibold text-primary text-sm">{order.product_title}</h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-subtle mt-1">賣家：{order.seller_name}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {order.start_date} ~ {order.end_date}（{order.days}天）
                      </span>
                      {order.product_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.product_location}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm font-semibold text-wood">
                        NT${order.total_amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-subtle">
                        (押金 NT${order.deposit.toLocaleString()})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Late fee warning */}
                {overdueDays > 0 && (
                  <div className={`mt-4 flex items-start gap-2 text-sm px-4 py-3 rounded-xl ${
                    overdueDays >= 7 ? 'bg-red-50 text-red-700 border border-red-200' :
                    overdueDays >= 3 ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  }`}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        超時 {overdueDays} 天 — 押金扣除 {lateFeeRate}%（NT${Math.round(order.deposit * lateFeeRate / 100).toLocaleString()}）
                      </p>
                      {overdueDays >= 7 && (
                        <p className="text-xs mt-0.5">超時7天以上，押金將全額沒收。如物品疑似遺失或遭竊，出租方可向警察機關報案，平台將協助提供交易紀錄。請儘速歸還商品或聯繫出租方處理。</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Dispute banner */}
                {order.status === 'disputed' && (
                  <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>賣家申請押金賠償，平台客服正在處理中。押金暫時凍結，請等候通知。</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  {order.status === 'pending' && (
                    <>
                      <Link
                        href={`/checkout/${order.id}`}
                        className="flex items-center gap-1.5 bg-wood hover:bg-wood-h text-white text-xs font-medium px-4 py-2 rounded-full transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" /> 前往付款
                      </Link>
                      <button
                        onClick={() => handleCancel(order.id)}
                        className="flex items-center gap-1.5 border border-red-200 text-red-500 text-xs font-medium px-4 py-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> 取消訂單
                      </button>
                    </>
                  )}

                  {order.status === 'confirmed' && !order.buyer_confirmed && (
                    <button
                      onClick={() => handleConfirm(order.id)}
                      className="flex items-center gap-1.5 bg-wood hover:bg-wood-h text-white text-xs font-medium px-4 py-2 rounded-full transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> 確認租借
                    </button>
                  )}
                  {order.status === 'confirmed' && order.buyer_confirmed === 1 && !order.seller_confirmed && (
                    <span className="flex items-center gap-1.5 text-muted text-xs">
                      <Clock className="w-3.5 h-3.5" /> 已確認，等待賣家確認
                    </span>
                  )}

                  {order.status === 'handover' && buyerPhotos.length === 0 && (
                    <label className={`flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-full transition-colors cursor-pointer ${uploadingId === order.id ? 'opacity-60 pointer-events-none' : ''}`}>
                      <input type="file" accept="image/*,video/*" multiple className="hidden"
                        onChange={(e) => e.target.files && handleHandoverUpload(order.id, e.target.files)} />
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingId === order.id ? '上傳中...' : '上傳驗貨照片/影片'}
                    </label>
                  )}
                  {order.status === 'handover' && buyerPhotos.length > 0 && sellerPhotos.length === 0 && (
                    <span className="flex items-center gap-1.5 text-muted text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 已上傳，等待賣家上傳
                    </span>
                  )}
                  {order.status === 'handover' && buyerPhotos.length > 0 && sellerPhotos.length > 0 && (
                    <span className="flex items-center gap-1.5 text-green-600 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 雙方已上傳，即將開始計時
                    </span>
                  )}

                  {order.status === 'active' && (
                    <label className={`flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-4 py-2 rounded-full transition-colors cursor-pointer ${uploadingId === order.id ? 'opacity-60 pointer-events-none' : ''}`}>
                      <input type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => e.target.files && handleReturnUpload(order.id, e.target.files)} />
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingId === order.id ? '上傳中...' : '上傳歸還照片，申請歸還'}
                    </label>
                  )}

                  {order.status === 'returning' && (
                    <span className="flex items-center gap-1.5 text-muted text-xs">
                      <Clock className="w-3.5 h-3.5" /> 等待賣家確認收到商品
                    </span>
                  )}

                  {order.status === 'completed' && !order.buyer_reviewed && (
                    <button
                      onClick={() => { setReviewingOrder(order.id); setRating(5); setComment(''); }}
                      className="flex items-center gap-1.5 bg-yellow-500 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" /> 評價賣家
                    </button>
                  )}
                  {order.status === 'completed' && order.buyer_reviewed === 1 && (
                    <span className="flex items-center gap-1.5 text-green-600 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 已評價
                    </span>
                  )}

                  {/* Chat button for active orders */}
                  {['confirmed', 'handover', 'active', 'returning'].includes(order.status) && (
                    <button
                      onClick={() => setChatOrder({ id: order.id, name: order.seller_name })}
                      className="flex items-center gap-1.5 border border-border text-muted text-xs font-medium px-4 py-2 rounded-full hover:bg-surface transition-colors ml-auto"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-wood" /> 聊天
                    </button>
                  )}
                </div>

                {/* Review form */}
                {reviewingOrder === order.id && (
                  <form onSubmit={handleReview} className="mt-4 pt-4 border-t border-border space-y-3">
                    <p className="text-sm font-medium text-primary">為賣家留下評價</p>
                    <StarRating rating={rating} onChange={setRating} size="lg" />
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder="分享您的租借體驗..."
                      className="muji-input w-full resize-none"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setReviewingOrder(null)}
                        className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:bg-surface transition-colors">
                        取消
                      </button>
                      <button type="submit" disabled={submittingReview}
                        className="px-4 py-2 bg-wood hover:bg-wood-h text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
                        {submittingReview ? '提交中...' : '提交評價'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chat window */}
      {chatOrder && (
        <ChatWindow
          orderId={chatOrder.id}
          counterpartName={chatOrder.name}
          onClose={() => setChatOrder(null)}
        />
      )}
    </div>
  );
}
