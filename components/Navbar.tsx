'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useDarkMode } from './DarkModeProvider';
import { Search, Package, LogOut, ChevronDown, Menu, X, Plus, ShoppingBag, Tag, Sun, Moon, ShieldCheck, Bell } from 'lucide-react';

export function Navbar() {
  const { user, logout, token } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const router = useRouter();
  const [searchQ, setSearchQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<{ id: number; message: string; link: string; is_read: number; created_at: string }[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!user || !token) return;
    const fetchNotifs = () => {
      fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { setUnreadCount(d.unread ?? 0); setNotifications(d.notifications ?? []); })
        .catch(() => {});
    };
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [user, token]);

  function openNotifications() {
    setNotifOpen(v => !v);
    setUserMenuOpen(false);
    if (unreadCount > 0) {
      fetch('/api/notifications', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
        .then(() => setUnreadCount(0));
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(searchQ ? `/?q=${encodeURIComponent(searchQ)}` : '/');
    setMenuOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border zx-nav-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--pink-400), var(--pink-700))', boxShadow: 'var(--shadow-sm)' }}
            >
              享
            </div>
            <span className="hidden sm:block" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              享租 <span style={{ color: 'var(--wood)' }}>Oink!</span>
            </span>
          </Link>

          {/* Search — pill shape */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="搜尋商品..."
                className="w-full pl-11 pr-4 py-2 bg-surface border border-border rounded-full text-sm text-primary placeholder:text-subtle focus:outline-none focus:border-wood focus:ring-2 focus:ring-wood/15 transition-all"
              />
            </div>
          </form>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1.5">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-full hover:bg-surface transition-colors text-muted hover:text-primary"
              aria-label="切換深色模式"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                <Link
                  href="/products/new"
                  className="flex items-center gap-1.5 bg-wood hover:bg-wood-h text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  上架商品
                </Link>

                {/* Notification bell */}
                <div className="relative">
                  <button
                    onClick={openNotifications}
                    className="relative p-2 rounded-full hover:bg-surface transition-colors text-muted hover:text-primary"
                    aria-label="通知"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-wood text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-2xl border border-border py-1 z-50 shadow-lg">
                      <div className="px-4 py-2.5 border-b border-border">
                        <p className="text-sm font-semibold text-primary">通知</p>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-sm text-muted text-center py-6">目前沒有通知</p>
                      ) : (
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.map(n => (
                            <a
                              key={n.id}
                              href={n.link || '#'}
                              onClick={() => setNotifOpen(false)}
                              className={`flex items-start gap-2 px-4 py-3 hover:bg-surface transition-colors border-b border-border last:border-0 ${!n.is_read ? 'bg-wood-lt/60' : ''}`}
                            >
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-wood' : 'bg-border'}`} />
                              <div>
                                <p className="text-sm text-primary leading-snug">{n.message}</p>
                                <p className="text-xs text-subtle mt-0.5">{new Date(n.created_at).toLocaleString('zh-TW')}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-surface transition-colors text-sm text-primary border border-transparent hover:border-border"
                  >
                    <div className="w-7 h-7 rounded-full bg-wood flex items-center justify-center text-white font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-medium">{user.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-subtle" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-card rounded-2xl border border-border py-1.5 z-50 shadow-lg">
                      <Link
                        href="/my/listings"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-surface transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Tag className="w-4 h-4 text-subtle" /> 我的商品
                      </Link>
                      <Link
                        href="/my/rentals"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-surface transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ShoppingBag className="w-4 h-4 text-subtle" /> 我的租借
                      </Link>
                      <Link
                        href="/my/lending"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-surface transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package className="w-4 h-4 text-subtle" /> 出租管理
                      </Link>
                      <Link
                        href="/my/verify"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-surface transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ShieldCheck className="w-4 h-4 text-subtle" /> 公司認證申請
                      </Link>
                      {user.id === 1 && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-wood hover:bg-wood-lt transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ShieldCheck className="w-4 h-4" /> 管理後台
                        </Link>
                      )}
                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" /> 登出
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm text-muted px-4 py-2 rounded-full hover:bg-surface transition-colors font-medium border border-transparent hover:border-border">
                  登入
                </Link>
                <Link href="/register" className="text-sm bg-wood hover:bg-wood-h text-white px-4 py-2 rounded-full transition-colors font-medium shadow-sm">
                  註冊
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: dark toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggle}
              className="p-2 rounded-full hover:bg-surface transition-colors text-muted"
              aria-label="切換深色模式"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-lg hover:bg-surface transition-colors text-primary"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="搜尋商品..."
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-full text-sm text-primary placeholder:text-subtle focus:outline-none focus:border-wood focus:ring-2 focus:ring-wood/15"
              />
            </div>
            <button type="submit" className="bg-wood hover:bg-wood-h text-white px-4 py-2 rounded-full text-sm transition-colors font-medium">搜尋</button>
          </form>
          {user ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary">
                <div className="w-6 h-6 rounded-full bg-wood flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                {user.name}
              </div>
              <Link href="/products/new" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface rounded-lg transition-colors">
                <Plus className="w-4 h-4 text-subtle" /> 上架商品
              </Link>
              <Link href="/my/listings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface rounded-lg transition-colors">
                <Tag className="w-4 h-4 text-subtle" /> 我的商品
              </Link>
              <Link href="/my/rentals" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface rounded-lg transition-colors">
                <ShoppingBag className="w-4 h-4 text-subtle" /> 我的租借
              </Link>
              <Link href="/my/lending" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface rounded-lg transition-colors">
                <Package className="w-4 h-4 text-subtle" /> 出租管理
              </Link>
              <Link href="/my/verify" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface rounded-lg transition-colors">
                <ShieldCheck className="w-4 h-4 text-subtle" /> 公司認證申請
              </Link>
              {user.id === 1 && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-wood hover:bg-wood-lt rounded-lg transition-colors">
                  <ShieldCheck className="w-4 h-4" /> 管理後台
                </Link>
              )}
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg w-full transition-colors"
              >
                <LogOut className="w-4 h-4" /> 登出
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm text-muted px-4 py-2 border border-border rounded-full hover:bg-surface transition-colors">登入</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-wood hover:bg-wood-h text-white px-4 py-2 rounded-full transition-colors font-medium">註冊</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
