import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { DarkModeProvider } from "@/components/DarkModeProvider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "享租 Oink! — 租借交易平台",
  description: "找到你需要的物品，或把閒置物品出租給有需要的人",
};

// Anti-flash script: runs synchronously before first paint
const darkScript = `(function(){try{var t=localStorage.getItem('theme'),p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&p)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: darkScript }} />
      </head>
      <body className="min-h-screen bg-bg text-primary">
        <AuthProvider>
          <DarkModeProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="bg-card border-t border-border mt-20 py-10">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-sm text-muted tracking-wide">© 2024 享租 Oink!　讓閒置物品發揮最大價值</p>
              </div>
            </footer>
          </DarkModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
