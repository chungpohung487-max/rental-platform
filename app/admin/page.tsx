'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ShieldCheck, Clock, CheckCircle2, XCircle, Star, User } from 'lucide-react';

interface VerifyRequest {
  id: number;
  user_id: number;
  reason: string;
  status: string;
  created_at: string;
  name: string;
  email: string;
  rating: number;
  rating_count: number;
}

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<VerifyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/admin/verify', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (user.id !== 1) { router.replace('/'); return; }
    fetchRequests();
  }, [user, authLoading, router, fetchRequests]);

  async function handleAction(userId: number, action: 'approve' | 'reject') {
    setActing(userId);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.map((r) =>
          r.user_id === userId
            ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' }
            : r
        ));
      }
    } finally {
      setActing(null);
    }
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const done = requests.filter((r) => r.status !== 'pending');

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
            <div className="h-5 bg-surface rounded w-1/3 mb-3" />
            <div className="h-3 bg-surface rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-wood" />
          <h1 className="text-2xl font-bold text-primary">管理後台</h1>
        </div>
        <p className="text-muted text-sm">審核賣家認證申請</p>
      </div>

      {/* Pending */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          待審核 ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-subtle">
            <CheckCircle2 className="w-10 h-10 text-border mx-auto mb-3" />
            <p>目前沒有待審核的申請</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                acting={acting}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
            已處理 ({done.length})
          </h2>
          <div className="space-y-3">
            {done.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                acting={acting}
                onAction={handleAction}
                readonly
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RequestCard({
  req, acting, onAction, readonly = false
}: {
  req: VerifyRequest;
  acting: number | null;
  onAction: (userId: number, action: 'approve' | 'reject') => void;
  readonly?: boolean;
}) {
  const isActing = acting === req.user_id;

  return (
    <div className={`bg-card border rounded-2xl p-5 ${
      req.status === 'approved' ? 'border-green-200' :
      req.status === 'rejected' ? 'border-red-200' :
      'border-border'
    }`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-wood-lt flex items-center justify-center text-wood font-bold flex-shrink-0">
          {req.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-primary text-sm">{req.name}</p>
            {req.status === 'approved' && (
              <span className="flex items-center gap-0.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5" /> 已通過
              </span>
            )}
            {req.status === 'rejected' && (
              <span className="flex items-center gap-0.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                <XCircle className="w-2.5 h-2.5" /> 已拒絕
              </span>
            )}
            {req.status === 'pending' && (
              <span className="flex items-center gap-0.5 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                <Clock className="w-2.5 h-2.5" /> 待審核
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-subtle flex items-center gap-1">
              <User className="w-3 h-3" /> {req.email}
            </span>
            <span className="text-xs text-subtle flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              {req.rating > 0 ? `${req.rating.toFixed(1)} (${req.rating_count}則)` : '新賣家'}
            </span>
            <span className="text-xs text-subtle">
              {new Date(req.created_at).toLocaleDateString('zh-TW')}
            </span>
          </div>
        </div>
      </div>

      {req.reason && (
        <div className="bg-surface border border-border rounded-xl p-3 mb-4">
          <p className="text-xs text-muted font-medium mb-1">申請說明</p>
          <p className="text-sm text-primary leading-relaxed">{req.reason}</p>
        </div>
      )}

      {!readonly && req.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => onAction(req.user_id, 'approve')}
            disabled={isActing}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-60 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isActing ? '處理中...' : '核准'}
          </button>
          <button
            onClick={() => onAction(req.user_id, 'reject')}
            disabled={isActing}
            className="flex items-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium px-4 py-2 rounded-lg disabled:opacity-60 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            拒絕
          </button>
        </div>
      )}
    </div>
  );
}
