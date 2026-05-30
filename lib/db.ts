import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// neon()'s TS types only expose the tagged-template overload;
// cast to the plain-function signature we actually need.
type SqlFn = (query: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

let _sql: SqlFn | null = null;
let _initPromise: Promise<void> | null = null;

function getSql(): SqlFn {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!) as unknown as SqlFn;
  return _sql;
}

// Convert SQLite ? placeholders to PostgreSQL $1, $2, ...
function toPositional(query: string): string {
  let i = 0;
  return query.replace(/\?/g, () => `$${++i}`);
}

// Neon doesn't accept BigInt params; convert to Number (IDs are always safe)
function normalizeArgs(args: unknown[]): unknown[] {
  return args.map(a => (typeof a === 'bigint' ? Number(a) : a));
}

async function ensureInit(): Promise<void> {
  if (!_initPromise) _initPromise = initSchema();
  return _initPromise;
}

export async function dbGet<T>(query: string, args: unknown[] = []): Promise<T | null> {
  await ensureInit();
  const rows = await getSql()(toPositional(query), normalizeArgs(args));
  return (rows[0] as T) ?? null;
}

export async function dbAll<T>(query: string, args: unknown[] = []): Promise<T[]> {
  await ensureInit();
  return await getSql()(toPositional(query), normalizeArgs(args)) as T[];
}

// Internal run — no ensureInit, safe to call during schema initialization
async function _run(query: string, args: unknown[]): Promise<{ lastInsertRowid: bigint }> {
  const sql = getSql();
  const normalized = normalizeArgs(args);
  if (query.trimStart().toUpperCase().startsWith('INSERT')) {
    const rows = await sql(toPositional(query) + ' RETURNING id', normalized);
    return { lastInsertRowid: BigInt((rows[0] as { id: number })?.id ?? 0) };
  }
  await sql(toPositional(query), normalized);
  return { lastInsertRowid: BigInt(0) };
}

export async function dbRun(query: string, args: unknown[] = []): Promise<{ lastInsertRowid: bigint }> {
  await ensureInit();
  return _run(query, args);
}

export function calcLateFee(deposit: number, endDate: string): { days: number; fee: number; showReport: boolean } {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = now.getTime() - end.getTime();
  if (diffMs <= 0) return { days: 0, fee: 0, showReport: false };
  const days = Math.floor(diffMs / 86400000);
  let fee = 0;
  if (days >= 7) fee = deposit;
  else if (days >= 3) fee = deposit * 0.5;
  else if (days >= 1) fee = deposit * 0.1;
  return { days, fee, showReport: days >= 7 };
}

export async function getAvailableQty(productId: number | bigint, totalQty: number): Promise<number> {
  const row = await dbGet<{ c: number }>(
    "SELECT COUNT(*) as c FROM orders WHERE product_id = ? AND status IN ('pending','confirmed','handover','active','returning','disputed')",
    [productId]
  );
  return Math.max(0, totalQty - (row?.c ?? 0));
}

async function initSchema() {
  const sql = getSql();
  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      avatar TEXT DEFAULT NULL, bio TEXT DEFAULT '', rating REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0, verified INTEGER NOT NULL DEFAULT 0,
      phone TEXT NOT NULL DEFAULT '', phone_verified INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      seller_id INTEGER NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '其他', images TEXT NOT NULL DEFAULT '[]',
      daily_rent REAL NOT NULL, deposit REAL NOT NULL, location TEXT DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 1, estimated_value REAL NOT NULL DEFAULT 0,
      latitude REAL DEFAULT NULL, longitude REAL DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'available', billing_unit TEXT NOT NULL DEFAULT 'daily',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL, buyer_id INTEGER NOT NULL, seller_id INTEGER NOT NULL,
      start_date TEXT NOT NULL, end_date TEXT NOT NULL, days INTEGER NOT NULL,
      billing_unit TEXT NOT NULL DEFAULT 'daily', total_rent REAL NOT NULL,
      deposit REAL NOT NULL, platform_fee REAL NOT NULL DEFAULT 0,
      seller_amount REAL NOT NULL DEFAULT 0, total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      buyer_confirmed INTEGER NOT NULL DEFAULT 0, seller_confirmed INTEGER NOT NULL DEFAULT 0,
      handover_buyer_photos TEXT NOT NULL DEFAULT '[]', handover_seller_photos TEXT NOT NULL DEFAULT '[]',
      return_buyer_photos TEXT NOT NULL DEFAULT '[]', return_seller_photos TEXT NOT NULL DEFAULT '[]',
      compensation_requested INTEGER NOT NULL DEFAULT 0, compensation_reason TEXT NOT NULL DEFAULT '',
      late_fee REAL NOT NULL DEFAULT 0, buyer_reviewed INTEGER NOT NULL DEFAULT 0,
      seller_reviewed INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id), FOREIGN KEY (seller_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id BIGSERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL, reviewer_id INTEGER NOT NULL, reviewee_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT DEFAULT '', review_type TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id), FOREIGN KEY (reviewee_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS verify_requests (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE, reason TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL, sender_id INTEGER NOT NULL, content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id), FOREIGN KEY (sender_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS phone_otps (
      id BIGSERIAL PRIMARY KEY,
      phone TEXT NOT NULL, otp TEXT NOT NULL, expires_at TIMESTAMP NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL, type TEXT NOT NULL DEFAULT 'order',
      message TEXT NOT NULL, link TEXT NOT NULL DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
  ];

  for (const stmt of stmts) {
    await sql(stmt, []);
  }

  const rows = await sql('SELECT COUNT(*) as c FROM users', []);
  if (Number((rows[0] as { c: number }).c) === 0) await seedData();
}

async function seedData() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const r1 = await _run(
    `INSERT INTO users (name, email, password, bio, rating, rating_count, verified, phone, phone_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['張小明', 'demo@example.com', hash('123456'), '熱愛分享好物，出租的東西都有好好保養！', 4.8, 12, 1, '0912345678', 1],
  );

  const r2 = await _run(
    `INSERT INTO users (name, email, password, bio, rating, rating_count, verified, phone, phone_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['李小美', 'seller@example.com', hash('123456'), '攝影愛好者，器材保養得很好，歡迎租借！', 4.9, 8, 1, '0923456789', 1],
  );

  const id1 = r1.lastInsertRowid;
  const id2 = r2.lastInsertRowid;

  const products = [
    { seller_id: id2, quantity: 2, ev: 80000, title: 'Canon EOS R5 全片幅相機', desc: 'Canon旗艦相機，支援8K影片錄製，附24-105mm鏡頭、兩顆電池與充電器。保養良好，快門數少。', cat: '電子產品', rent: 800, dep: 8000, loc: '台北市信義區', lat: 25.0330, lng: 121.5654 },
    { seller_id: id1, quantity: 3, ev: 15000, title: '捷安特 ATX 27.5吋山地自行車', desc: '21速Shimano變速系統，油壓碟剎，鋁合金車架，車況良好。附安全帽與打氣筒。', cat: '戶外運動', rent: 250, dep: 2000, loc: '新北市板橋區', lat: 25.0147, lng: 121.4675 },
    { seller_id: id2, quantity: 1, ev: 20000, title: '4人露營帳篷套組', desc: '防水帳篷含天幕，附4個睡袋、地墊與枕頭。快速搭建設計，適合4人家庭露營。', cat: '戶外運動', rent: 400, dep: 2500, loc: '台中市西區', lat: 24.1477, lng: 120.6736 },
    { seller_id: id1, quantity: 2, ev: 12000, title: 'Makita 專業電動工具組', desc: '含電鑽、砂磨機、電鋸等5件套，18V鋰電池，附各式鑽頭與配件。', cat: '工具設備', rent: 200, dep: 1500, loc: '台北市大安區', lat: 25.0268, lng: 121.5431 },
    { seller_id: id2, quantity: 1, ev: 50000, title: 'Epson 4K 雷射投影機', desc: '4000流明高亮度，支援4K解析度，附100吋投影布幕與HDMI線。', cat: '影音設備', rent: 600, dep: 5000, loc: '台北市中山區', lat: 25.0630, lng: 121.5236 },
    { seller_id: id1, quantity: 1, ev: 120000, title: 'DJI Mavic 3 空拍機', desc: 'DJI旗艦空拍機，哈蘇相機感光元件，最長46分鐘飛行時間。含3顆電池與攜帶包。', cat: '電子產品', rent: 1200, dep: 15000, loc: '台北市松山區', lat: 25.0494, lng: 121.5778 },
    { seller_id: id2, quantity: 2, ev: 25000, title: 'Roland 電子鋼琴 FP-30X', desc: '88鍵加重感電子鋼琴，模擬真實演奏觸感。附腳踏板、譜架與電源線。', cat: '影音設備', rent: 350, dep: 3000, loc: '台北市大安區', lat: 25.0270, lng: 121.5430 },
    { seller_id: id1, quantity: 4, ev: 6000, title: '露營炊具套組', desc: '含登山爐、鍋具組、餐具等全套炊具，輕量化設計，附收納袋。', cat: '戶外運動', rent: 150, dep: 800, loc: '新北市新莊區', lat: 25.0374, lng: 121.4494 },
  ];

  for (const p of products) {
    await _run(
      `INSERT INTO products (seller_id, title, description, category, images, daily_rent, deposit, location, quantity, estimated_value, latitude, longitude, status)
       VALUES (?, ?, ?, ?, '[]', ?, ?, ?, ?, ?, ?, ?, 'available')`,
      [p.seller_id, p.title, p.desc, p.cat, p.rent, p.dep, p.loc, p.quantity, p.ev, p.lat, p.lng],
    );
  }
}
