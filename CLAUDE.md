@AGENTS.md

# 租享網 — Rental Platform

P2P 租借交易平台。使用者可以上架閒置物品供他人租借，也可以租借別人的物品。

---

## 技術架構

| 層面 | 技術 |
|------|------|
| 框架 | Next.js 16.2.6 (App Router, Turbopack) |
| 語言 | TypeScript |
| 樣式 | Tailwind CSS v4（CSS-first config，`@theme` + CSS variables） |
| 資料庫 | SQLite via `better-sqlite3`（singleton `global.__rentalDb`，WAL 模式） |
| 認證 | JWT（`jose` 套件）+ `bcryptjs` 密碼雜湊 |
| 地圖 | Leaflet.js（client-only dynamic import，OpenStreetMap tiles） |
| 圖片上傳 | 本地 `/public/uploads/` 目錄 |
| 手機驗證 | 模擬 SMS OTP（demo mode：API 回傳 OTP 供測試） |

### 重要設定
- `next.config.ts`：`serverExternalPackages: ['better-sqlite3', 'bcryptjs']`（不能用 webpack externals）
- `params` 在 Next.js 16 是 Promise，route handler 必須 `await params`
- 資料庫路徑：`/rental.db`（project root）

---

## 資料庫 Schema

### 資料表
- **users** — 帳號、密碼、評分、`verified`（公司認證）、`phone`、`phone_verified`
- **products** — 商品、`quantity`、`estimated_value`、`latitude`/`longitude`、`status`
- **orders** — 訂單，含完整租借流程欄位（見下方）
- **reviews** — 買賣雙方互評
- **verify_requests** — 公司認證申請
- **messages** — 訂單聊天訊息
- **phone_otps** — 手機 OTP（10 分鐘有效）

### Orders 關鍵欄位
```
status: pending → confirmed → handover → active → returning → completed
                                                             → disputed
                         ↓ (buyer/seller cancel)
                      cancelled
buyer_confirmed / seller_confirmed   (雙方確認機制)
handover_buyer_photos / handover_seller_photos  (面交驗貨)
return_buyer_photos                 (歸還照片)
platform_fee / seller_amount        (手續費：5%)
late_fee                            (超時罰金)
compensation_requested / compensation_reason
```

---

## API 路由

```
GET  /api/products              公開商品列表（支援 q/category 搜尋）
POST /api/products              新增商品（需登入）
GET  /api/products/mine         我的商品
GET  /api/products/[id]         商品詳情
PUT  /api/products/[id]         更新商品 status
DELETE /api/products/[id]       刪除商品

POST /api/auth/register         註冊（驗證 phone_otps）
POST /api/auth/login            登入，回傳 JWT
GET  /api/auth/me               取得當前用戶
POST /api/auth/phone            發送 OTP（demo 模式回傳明碼）
POST /api/auth/verify-phone     驗證 OTP，標記 used=1

GET  /api/orders?role=buyer|seller  訂單列表
POST /api/orders                    建立訂單（計算 platform_fee）
GET  /api/orders/[id]               訂單詳情
PATCH /api/orders/[id]              pending→confirmed（付款）/ 取消
POST /api/orders/[id]/confirm       買家或賣家確認租借
POST /api/orders/[id]/handover      上傳面交照片/影片（雙方各自）
POST /api/orders/[id]/return        買家上傳歸還照片
POST /api/orders/[id]/complete      賣家確認完成或申請押金賠償

GET  /api/messages?order_id=X  訂單聊天記錄
POST /api/messages              傳送訊息

POST /api/reviews               留下評價（buyer/seller 互評）

GET  /api/verify                查詢公司認證狀態
POST /api/verify                申請公司認證
GET  /api/admin/verify          管理員查看所有申請（需 user.id === 1）
POST /api/admin/verify          核准或拒絕申請

POST /api/upload                上傳圖片（≤5MB）或影片（≤100MB）
```

---

## 前端頁面

```
/                    首頁 — 商品列表、分類篩選、地圖切換
/login               登入
/register            註冊（含手機 OTP 驗證）
/products/[id]       商品詳情 + 選日期下單
/products/new        上架商品（含估值、押金驗證）
/checkout/[orderId]  模擬信用卡付款 → status: confirmed
/my/rentals          我的租借（完整租借流程 UI）
/my/lending          出租管理（完整賣家流程 UI）
/my/listings         我的商品（含每日實得金額顯示）
/my/verify           公司認證申請
/admin               管理後台（user.id === 1 才顯示）
```

---

## 核心商業邏輯

### 平台手續費（5%）
- `platform_fee = total_rent × 0.05`
- `seller_amount = total_rent × 0.95`
- `total_amount = total_rent + platform_fee + deposit`
- 押金全額退還給買家，不收手續費

### 押金規則
- 上架時：押金必須在估值的 30%–150% 之間
- 押金 = 糾紛最高賠償上限

### 超時罰金
- 超時 1 天：扣押金 10%
- 超時 3 天：扣押金 50%
- 超時 7 天：扣押金 100%

### 訂單流程
1. 買家下單 → `pending`
2. 買家付款 → `confirmed`（PATCH /api/orders/[id] `{ status: 'confirmed' }`）
3. 雙方各自點「確認租借」→ 兩者都確認後自動轉 `handover`
4. 雙方各自上傳面交照片/影片 → 兩者都上傳後自動轉 `active`，重設 `start_date`
5. 買家上傳歸還照片 → `returning`
6. 賣家確認完好 → `completed`；或申請賠償 → `disputed`（押金凍結）

---

## Components

| 元件 | 說明 |
|------|------|
| `Navbar` | 導覽列（深色模式切換、用戶選單） |
| `ProductCard` | 商品卡片（含認證公司標章、剩餘數量） |
| `OrderProgress` | 六步驟進度條（`getOrderStep(status)` 映射） |
| `ChatWindow` | 浮動聊天視窗（3 秒輪詢，右下角） |
| `LeafletMap` | Leaflet 地圖（動態 import，SSR 關閉） |
| `StarRating` | 星等評分元件 |
| `AuthProvider` | JWT 認證 Context |
| `DarkModeProvider` | 深色模式 Context |

---

## 樣式系統（Tailwind v4）

自訂 CSS 變數在 `app/globals.css`：
```css
--wood: #C4A882        /* 主色（暖木色） */
--wood-h: #B8976E      /* 主色 hover */
--wood-lt: #F5EDE0     /* 淺木色背景 */
--bg: #F7F4EF          /* 頁面背景 */
--card: #FFFFFF        /* 卡片背景 */
--surface: #F0EBE3     /* 次要背景 */
--border: #E5E0D8      /* 邊框 */
--primary: #2C2420     /* 主要文字 */
--muted: #7A7570       /* 次要文字 */
--subtle: #B8B0A8      /* 淡色文字 */

/* 深色模式 */
.dark { --bg: #1C1C1E; --card: #2C2C2E; ... }
```

常用 class：`muji-input`、`muji-shadow`、`bg-wood`、`text-primary`、`bg-surface`

---

## 目前狀態

**所有主要功能已實作完成，可正常運行。**

開發伺服器：`npm run dev`（port 3000）
資料庫：`rental.db`（含 8 筆種子商品，帶台北地區座標）

已實作的 11 個功能：
1. ✅ 雙方確認機制（買賣各自點確認，都確認後進入面交）
2. ✅ 深色模式（#1C1C1E Apple 深色色調）
3. ✅ 租借流程六步驟進度條
4. ✅ 面交驗貨照片/影片上傳（雙方都上傳才開始計時）
5. ✅ 超時未還罰金（1天10%、3天50%、7天100%）
6. ✅ 聊天系統（訂單內訊息，3秒輪詢）
7. ✅ 首頁地圖（Leaflet，顯示附近可租商品）
8. ✅ 平台手續費 5%（買家含稅總價，賣家看實得金額）
9. ✅ 押金範圍限制（估值 30%–150%，含提示文字）
10. ✅ 公司認證標章（「認證公司」badge，管理後台審核）
11. ✅ 手機號碼驗證（註冊時 OTP，demo 模式顯示明碼）

---

## 下一步可做的功能

### 高優先
- **真實 SMS 整合**：替換 demo OTP，接 Twilio / AWS SNS / 台灣簡訊服務
- **Email 通知**：訂單狀態變更時發送 email（新訂單、確認、面交提醒）
- **WebSocket 聊天**：取代 3 秒輪詢，用 Socket.io 或 Next.js SSE 實現即時訊息
- **押金自動退還邏輯**：completed 後自動觸發退押金流程

### 中優先
- **照片顯示**：在訂單頁顯示已上傳的驗貨照片縮圖
- **管理員客服判定介面**：disputed 訂單的押金分配決定
- **商品編輯頁**：目前只有上下架，沒有編輯內容的頁面（`/products/[id]/edit`）
- **用戶個人頁**：公開的賣家評價頁 (`/users/[id]`)
- **搜尋強化**：加入價格範圍篩選、地點篩選、排序

### 低優先
- **分頁/無限捲動**：商品列表目前一次全載
- **收藏功能**：心願清單 / 追蹤賣家
- **推播通知**：Web Push API
- **多語言**：i18n（目前全中文）
- **支付整合**：串接真實金流（綠界、街口、LinePay）
