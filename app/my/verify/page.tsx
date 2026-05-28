'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ShieldCheck, Clock, CheckCircle2, XCircle, Send } from 'lucide-react';

interface VerifyStatus {
  verified: number;
  request: {
    status: 'pending' | 'approved' | 'rejected';
    reason: string;
    created_at: string;
  } | null;
}

export default function VerifyPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    fetch('/api/verify', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .finally(() => setLoading(false));
  }, [user, token, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(true);
      setStatus((prev) => prev ? {
        ...prev,
        request: { status: 'pending', reason, created_at: new Date().toISOString() }
      } : null);
    } catch {
      setError('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-card border border-border rounded-2xl p-8 animate-pulse">
          <div className="h-6 bg-surface rounded w-1/3 mb-4" />
          <div className="h-4 bg-surface rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2">公司認證申請</h1>
        <p className="text-muted text-sm">通過認證的商家在商品頁面將顯示認證標章，提升買家信任度</p>
      </div>

      {/* Already verified */}
      {status?.verified === 1 && (
        <div className="bg-card border border-wood/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-wood-lt rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-wood" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">您已是認證商家</h2>
          <p className="text-muted text-sm">您的認證狀態有效，商品旁邊將顯示認證標章</p>
        </div>
      )}

      {/* Pending */}
      {status?.verified !== 1 && status?.request?.status === 'pending' && (
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-bold text-primary">申請審核中</h2>
              <p className="text-muted text-sm">管理員將在近期審核您的申請</p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted">申請狀態</span>
              <span className="text-yellow-600 font-medium">審核中</span>
            </div>
            {status.request.reason && (
              <div>
                <span className="text-muted block mb-1">申請說明</span>
                <p className="text-primary">{status.request.reason}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted">申請時間</span>
              <span className="text-muted">{new Date(status.request.created_at).toLocaleDateString('zh-TW')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Approved (but verified !== 1, edge case) */}
      {status?.verified !== 1 && status?.request?.status === 'approved' && (
        <div className="bg-card border border-green-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="font-bold text-primary mb-1">申請已通過</h2>
          <p className="text-muted text-sm">您的商家認證已獲批准</p>
        </div>
      )}

      {/* Rejected — allow reapply */}
      {status?.verified !== 1 && status?.request?.status === 'rejected' && !success && (
        <div className="space-y-4">
          <div className="bg-card border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-primary">上次申請未通過</p>
                <p className="text-muted text-sm">您可以修改說明後重新申請</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-primary">重新申請認證</h2>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">申請說明</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="請說明您的出租經驗、商品類型，以及為什麼希望成為認證商家..."
                className="muji-input w-full resize-none"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={submitting}
              className="w-full bg-wood hover:bg-wood-h text-white py-2.5 rounded-full text-sm font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              {submitting ? '提交中...' : '提交申請'}
            </button>
          </form>
        </div>
      )}

      {/* No request yet OR success */}
      {status?.verified !== 1 && (!status?.request || success) && status?.request?.status !== 'pending' && status?.request?.status !== 'rejected' && (
        <form onSubmit={handleSubmit} className="bg-card border border-border muji-shadow rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-10 h-10 bg-wood-lt rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-wood" />
            </div>
            <div>
              <h2 className="font-semibold text-primary">申請認證商家</h2>
              <p className="text-muted text-sm">填寫申請說明，等待管理員審核</p>
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              申請已提交，請等待管理員審核
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">申請說明</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder="請說明您的出租經驗、商品類型，以及為什麼希望成為認證商家...&#10;&#10;例：我在平台上已出租相機設備超過半年，獲得多則好評，希望透過認證提升買家信任度。"
              className="muji-input w-full resize-none"
            />
            <p className="text-xs text-subtle mt-1.5">詳細的說明有助於加快審核速度</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full bg-wood hover:bg-wood-h text-white py-2.5 rounded-full text-sm font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            {submitting ? '提交中...' : '送出申請'}
          </button>
        </form>
      )}

      {/* Info box */}
      <div className="mt-6 bg-surface border border-border rounded-xl p-4 text-sm text-muted space-y-2">
        <p className="font-medium text-primary">認證說明</p>
        <ul className="space-y-1 list-disc list-inside text-muted">
          <li>認證標章顯示於商品列表與商品詳情頁</li>
          <li>審核通常在 1–3 個工作天內完成</li>
          <li>申請被拒絕後可修改說明重新提交</li>
        </ul>
      </div>
    </div>
  );
}
