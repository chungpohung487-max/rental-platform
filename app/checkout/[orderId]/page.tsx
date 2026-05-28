'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { CreditCard, Lock, CheckCircle2, Package, Calendar, MapPin } from 'lucide-react';

interface Order {
  id: number; product_title: string; product_images: string; product_location: string;
  start_date: string; end_date: string; days: number; billing_unit?: string;
  total_rent: number; deposit: number; total_amount: number; platform_fee: number;
  status: string; seller_name: string;
}

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    fetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.order) setOrder(data.order);
        else router.replace('/my/rentals');
      })
      .finally(() => setLoading(false));
  }, [orderId, user, token, authLoading, router]);

  function formatCard(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(v: string) {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 16) { setError('請輸入完整的信用卡號碼'); return; }
    if (!cardName) { setError('請輸入持卡人姓名'); return; }
    if (expiry.length < 5) { setError('請輸入正確的有效期限'); return; }
    if (cvv.length < 3) { setError('請輸入正確的安全碼'); return; }

    setPaying(true);
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      if (res.ok) {
        setPaid(true);
      } else {
        const data = await res.json();
        setError(data.error || '付款失敗');
      }
    } catch {
      setError('網路錯誤，請稍後再試');
    } finally {
      setPaying(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-wood border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const images: string[] = JSON.parse(order.product_images || '[]');

  if (paid) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-card border border-border muji-shadow rounded-2xl p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">付款成功！</h1>
          <p className="text-muted text-sm mb-6">付款完成！請前往「我的租借」與賣家雙方確認租借後安排面交。</p>
          <div className="bg-surface border border-border rounded-xl p-4 text-left text-sm space-y-2 mb-8">
            <p className="font-medium text-primary">{order.product_title}</p>
            <p className="text-muted">
              {order.start_date} ~ {order.end_date}（{order.days}天）
            </p>
            <p className="text-wood font-semibold">
              已付款 NT${order.total_amount.toLocaleString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/my/rentals" className="flex-1 py-2.5 bg-wood hover:bg-wood-h text-white rounded-full text-sm font-semibold transition-colors text-center shadow-sm">
              查看我的租借
            </Link>
            <Link href="/" className="flex-1 py-2.5 border border-border text-muted rounded-full text-sm font-medium hover:bg-surface transition-colors text-center">
              回首頁
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
        <CreditCard className="w-6 h-6 text-wood" /> 確認付款
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order summary */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-primary mb-4">訂單摘要</h2>
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-surface rounded-xl overflow-hidden flex-shrink-0">
                {images[0] ? (
                  <img src={images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-border" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-primary text-sm leading-snug">{order.product_title}</p>
                <p className="text-subtle text-xs mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {order.product_location || '未指定地點'}
                </p>
                <p className="text-muted text-xs mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {order.start_date} ~ {order.end_date}（{order.days}{order.billing_unit === 'hourly' ? '小時' : order.billing_unit === 'monthly' ? '月' : '天'}）
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>租金（NT${(order.total_rent / order.days).toLocaleString()} × {order.days}{order.billing_unit === 'hourly' ? '小時' : order.billing_unit === 'monthly' ? '月' : '天'}）</span>
                <span>NT${order.total_rent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>平台手續費（5%）</span>
                <span>NT${(order.platform_fee ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>押金（歸還後退還）</span>
                <span>NT${order.deposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-primary pt-2 border-t border-border">
                <span>總計</span>
                <span className="text-wood text-lg">NT${order.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-wood-lt border border-wood/20 rounded-xl p-4 text-sm text-muted">
            <p className="font-medium text-primary mb-1">模擬付款說明</p>
            <p>本平台使用模擬付款系統，不會收取任何真實費用。輸入任意格式正確的信用卡資訊即可完成付款。</p>
          </div>
        </div>

        {/* Payment form */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-primary mb-6 flex items-center gap-2">
            <Lock className="w-4 h-4 text-subtle" /> 信用卡資訊
          </h2>
          <form onSubmit={handlePay} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">卡號</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCard(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="muji-input w-full font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">持卡人姓名</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                placeholder="CARD HOLDER NAME"
                className="muji-input w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">有效期限</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="muji-input w-full font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">安全碼</label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="CVV"
                  className="muji-input w-full font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={paying}
              className="w-full bg-wood hover:bg-wood-h text-white py-3 rounded-full font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              {paying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  付款處理中...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  確認付款 NT${order.total_amount.toLocaleString()}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
