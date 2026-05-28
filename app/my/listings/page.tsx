'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Package, MapPin, Trash2, Plus, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

interface Product {
  id: number; title: string; description: string; category: string;
  images: string; daily_rent: number; deposit: number; location: string;
  status: string; created_at: string; estimated_value: number;
}

const STATUS = {
  available: { label: '上架中', color: 'bg-green-100 text-green-700' },
  rented: { label: '租借中', color: 'bg-blue-100 text-blue-700' },
  unavailable: { label: '已下架', color: 'bg-surface text-subtle' },
};

export default function MyListingsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchListings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/products/mine', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProducts(data.products ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    fetchListings();
  }, [user, authLoading, router, fetchListings]);

  async function handleDelete(productId: number) {
    if (!confirm('確定要刪除此商品嗎？此操作無法復原。')) return;
    setDeleting(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        alert(data.error);
      }
    } finally {
      setDeleting(null);
    }
  }

  async function toggleStatus(product: Product) {
    const newStatus = product.status === 'available' ? 'unavailable' : 'available';
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, status: newStatus } : p));
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        {[1, 2].map((i) => (
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
        <h1 className="text-2xl font-bold text-primary">我的商品</h1>
        <Link href="/products/new" className="flex items-center gap-2 bg-wood hover:bg-wood-h text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> 上架新商品
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center text-subtle">
          <Package className="w-14 h-14 text-border mx-auto mb-4" />
          <p className="text-lg font-medium text-muted">還沒有上架的商品</p>
          <p className="text-sm mt-1 mb-6 text-subtle">把閒置的物品出租給有需要的人，輕鬆獲得收入</p>
          <Link href="/products/new" className="bg-wood hover:bg-wood-h text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
            立即上架
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const images: string[] = JSON.parse(product.images || '[]');
            const st = STATUS[product.status as keyof typeof STATUS] ?? { label: product.status, color: 'bg-surface text-subtle' };
            return (
              <div key={product.id} className="bg-card border border-border rounded-2xl p-5">
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
                      <h3 className="font-semibold text-primary text-sm">{product.title}</h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-subtle mt-1">{product.category}</p>
                    {product.location && (
                      <p className="text-xs text-subtle mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {product.location}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
                      <span className="text-sm font-bold text-wood">NT${product.daily_rent.toLocaleString()}/天</span>
                      <span className="text-xs text-subtle">押金 NT${product.deposit.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      平台收取5%手續費，您實得 <span className="font-medium text-primary">NT${Math.round(product.daily_rent * 0.95).toLocaleString()}/天</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  <Link
                    href={`/products/${product.id}`}
                    className="flex items-center gap-1.5 border border-border text-muted text-xs font-medium px-3 py-1.5 rounded-full hover:bg-surface transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> 查看
                  </Link>
                  {product.status !== 'rented' && (
                    <button
                      onClick={() => toggleStatus(product)}
                      className="flex items-center gap-1.5 border border-border text-muted text-xs font-medium px-3 py-1.5 rounded-full hover:bg-surface transition-colors"
                    >
                      {product.status === 'available'
                        ? <><ToggleRight className="w-3.5 h-3.5 text-green-500" /> 下架</>
                        : <><ToggleLeft className="w-3.5 h-3.5 text-subtle" /> 重新上架</>
                      }
                    </button>
                  )}
                  {product.status !== 'rented' && (
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                      className="flex items-center gap-1.5 border border-red-200 text-red-500 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deleting === product.id ? '刪除中...' : '刪除'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
