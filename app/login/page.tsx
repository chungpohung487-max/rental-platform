'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Package, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      login(data.token, data.user);
      router.push('/');
    } catch {
      setError('連線失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail('demo@example.com');
    setPassword('123456');
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-wood rounded-2xl mb-4 shadow-sm">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary">歡迎回來</h1>
          <p className="text-muted mt-1 text-sm">登入您的享租 Oink! 帳號</p>
        </div>

        <div className="bg-card muji-shadow border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">電子郵件</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="muji-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">密碼</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••"
                  className="muji-input w-full pr-12"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted transition-colors">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wood hover:bg-wood-h text-white py-2.5 rounded-full font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? '登入中...' : '登入'}
            </button>
          </form>

          <div className="mt-4">
            <button
              type="button"
              onClick={fillDemo}
              className="w-full py-2.5 rounded-xl text-sm text-muted border border-dashed border-border hover:bg-surface transition-colors"
            >
              使用測試帳號（demo@example.com）
            </button>
          </div>

          <p className="text-center text-sm text-muted mt-6">
            還沒有帳號？{' '}
            <Link href="/register" className="text-wood font-medium hover:underline">
              立即註冊
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
