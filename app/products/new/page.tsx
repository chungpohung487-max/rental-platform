'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Upload, X, Plus, ImageIcon } from 'lucide-react';

const CATEGORIES = ['電子產品', '工具設備', '戶外運動', '影音設備', '服裝配件', '家居家具', '書籍文具', '其他'];

export default function NewProductPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('電子產品');
  const [location, setLocation] = useState('');
  const [dailyRent, setDailyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [billingUnit, setBillingUnit] = useState<'hourly' | 'daily' | 'monthly'>('daily');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const unitLabel = billingUnit === 'hourly' ? '小時' : billingUnit === 'monthly' ? '月' : '天';

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > 5) {
      setError('最多只能上傳5張圖片');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        uploaded.push(data.url);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '上傳失敗');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title || !description || !dailyRent || !deposit || !estimatedValue) {
      setError('請填寫所有必填欄位（含商品估值）');
      return;
    }
    const ev = parseFloat(estimatedValue);
    const dep = parseFloat(deposit);
    if (ev > 0 && (dep < ev * 0.3 || dep > ev * 1.5)) {
      setError(`押金必須在商品估值的 30%（NT$${Math.ceil(ev * 0.3)}）到 150%（NT$${Math.floor(ev * 1.5)}）之間`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title, description, category, location,
          daily_rent: parseFloat(dailyRent),
          deposit: parseFloat(deposit),
          estimated_value: parseFloat(estimatedValue) || 0,
          quantity: parseInt(quantity) || 1,
          billing_unit: billingUnit,
          images,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/products/${data.product.id}`);
    } catch {
      setError('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-primary mb-2">上架商品</h1>
      <p className="text-muted text-sm mb-8">填寫商品資訊，讓有需要的人找到你的物品</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-primary mb-4">商品照片</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square bg-surface rounded-xl overflow-hidden group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="aspect-square bg-surface border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-wood hover:bg-wood-lt transition-colors">
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-wood border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-subtle mb-1" />
                    <span className="text-xs text-subtle">新增</span>
                  </>
                )}
              </label>
            )}
          </div>
          <p className="text-xs text-subtle flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            最多5張，支援 JPG/PNG/WebP，每張不超過5MB
          </p>
        </div>

        {/* Basic info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-primary">基本資訊</h2>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">商品名稱 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="例：Canon EOS R5 全片幅相機"
              maxLength={100}
              className="muji-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">商品描述 *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="詳細描述商品狀況、規格、附件等..."
              className="muji-input w-full resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">分類</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="muji-input w-full bg-card"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">取貨地點</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例：台北市大安區"
                className="muji-input w-full"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Quantity */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-primary">租金與數量</h2>

          {/* Billing unit */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">計費單位</label>
            <div className="flex gap-2">
              {(['hourly', 'daily', 'monthly'] as const).map((u) => {
                const label = u === 'hourly' ? '按小時' : u === 'monthly' ? '按月' : '按天';
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setBillingUnit(u)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      billingUnit === u
                        ? 'bg-wood text-white border-wood'
                        : 'bg-surface text-muted border-border hover:border-wood'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">租金 (NT$/{unitLabel}) *</label>
              <input
                type="number"
                value={dailyRent}
                onChange={(e) => setDailyRent(e.target.value)}
                required
                min="1"
                step="1"
                placeholder="500"
                className="muji-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">商品估值 (NT$) *</label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                required
                min="1"
                step="1"
                placeholder="10000"
                className="muji-input w-full"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="text-sm font-medium text-primary">押金 (NT$) *</label>
              <span className="text-xs text-muted bg-surface border border-border px-2 py-0.5 rounded-full">
                須為估值的 30%–150%
              </span>
            </div>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              required
              min="0"
              step="1"
              placeholder="3000"
              className="muji-input w-full"
            />
            <p className="text-xs text-muted mt-1.5">押金為租借糾紛最高賠償上限，請依商品實際價值謹慎設定</p>
            {estimatedValue && deposit && (() => {
              const ev = parseFloat(estimatedValue);
              const dep = parseFloat(deposit);
              if (ev > 0 && dep > 0 && (dep < ev * 0.3 || dep > ev * 1.5)) {
                return <p className="text-xs text-red-500 mt-1">押金須在 NT${Math.ceil(ev * 0.3)} ~ NT${Math.floor(ev * 1.5)} 之間</p>;
              }
              return null;
            })()}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">數量 (件)</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max="99"
              step="1"
              placeholder="1"
              className="muji-input w-full"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-border rounded-full text-sm text-muted font-medium hover:bg-surface transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="flex-2 flex-grow-[2] py-3 bg-wood hover:bg-wood-h text-white rounded-full text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {submitting ? '上架中...' : '確認上架'}
          </button>
        </div>
      </form>
    </div>
  );
}
