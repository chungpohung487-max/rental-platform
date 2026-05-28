'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Package, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  async function handleSendOtp() {
    if (!/^09\d{8}$/.test(phone)) { setError('請輸入正確的台灣手機號碼（09開頭，共10碼）'); return; }
    setError('');
    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setOtpSent(true);
      setDemoOtp(data.demo_otp ?? '');
    } catch { setError('發送失敗，請稍後再試'); }
    finally { setSendingOtp(false); }
  }

  async function handleVerifyOtp() {
    if (!otp) { setError('請輸入驗證碼'); return; }
    setError('');
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setPhoneVerified(true);
    } catch { setError('驗證失敗，請稍後再試'); }
    finally { setVerifyingOtp(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!phoneVerified) { setError('請先完成手機號碼驗證'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      login(data.token, data.user);
      router.push('/');
    } catch { setError('連線失敗，請稍後再試'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-wood rounded-2xl mb-4 shadow-sm">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary">建立帳號</h1>
          <p className="text-muted mt-1 text-sm">加入享租 Oink!，開始租借與出租</p>
        </div>

        <div className="bg-card muji-shadow border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">姓名</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="您的姓名" className="muji-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">電子郵件</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="muji-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">
                密碼 <span className="text-subtle font-normal">(至少6個字元)</span>
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••" className="muji-input w-full pr-12" />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted transition-colors">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Phone verification */}
            <div className="border border-border rounded-xl p-4 space-y-3 bg-surface">
              <p className="text-sm font-medium text-primary flex items-center gap-1.5">
                手機號碼驗證
                {phoneVerified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </p>
              {!phoneVerified ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xxxxxxxx"
                      maxLength={10}
                      className="muji-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || phone.length !== 10}
                      className="px-3 py-2 bg-wood hover:bg-wood-h text-white rounded-full text-sm font-medium disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {sendingOtp ? '發送中...' : otpSent ? '重新發送' : '發送驗證碼'}
                    </button>
                  </div>
                  {demoOtp && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800">
                      測試模式 — 驗證碼：<strong className="text-lg tracking-widest">{demoOtp}</strong>
                    </div>
                  )}
                  {otpSent && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6位數驗證碼"
                        maxLength={6}
                        className="muji-input flex-1 font-mono tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otp.length !== 6}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        {verifyingOtp ? '驗證中...' : '驗證'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-green-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {phone} 已驗證
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button type="submit" disabled={loading || !phoneVerified}
              className="w-full bg-wood hover:bg-wood-h text-white py-2.5 rounded-full font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm">
              {loading ? '建立中...' : '建立帳號'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            已有帳號？ <Link href="/login" className="text-wood font-medium hover:underline">立即登入</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
