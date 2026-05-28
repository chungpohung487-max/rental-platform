import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbAll, dbGet, dbRun } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const area = searchParams.get('area') ?? '';
  const minPrice = searchParams.get('min_price') ?? '';
  const maxPrice = searchParams.get('max_price') ?? '';
  const billingUnit = searchParams.get('billing_unit') ?? '';

  let sql = `
    SELECT p.*,
      u.name as seller_name, u.rating as seller_rating,
      u.rating_count as seller_rating_count, u.verified as seller_verified,
      (p.quantity - COALESCE(
        (SELECT COUNT(*) FROM orders WHERE product_id = p.id AND status IN ('pending','confirmed','handover','active','returning','disputed')), 0
      )) as available_quantity
    FROM products p JOIN users u ON p.seller_id = u.id
    WHERE p.status = 'available'
  `;
  const params: (string | number)[] = [];

  if (q) {
    sql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    sql += ' AND p.category = ?';
    params.push(category);
  }
  if (area) {
    sql += ' AND p.location LIKE ?';
    params.push(`%${area}%`);
  }
  if (minPrice) {
    sql += ' AND p.daily_rent >= ?';
    params.push(parseFloat(minPrice));
  }
  if (maxPrice) {
    sql += ' AND p.daily_rent <= ?';
    params.push(parseFloat(maxPrice));
  }
  if (billingUnit) {
    sql += ' AND p.billing_unit = ?';
    params.push(billingUnit);
  }

  sql += ' ORDER BY p.created_at DESC';

  const products = await dbAll(sql, params);
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    const { title, description, category, images, daily_rent, deposit, location, quantity, estimated_value, latitude, longitude, billing_unit } = await request.json();

    if (!title || !description || daily_rent == null || deposit == null)
      return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 });

    const qty = Math.max(1, parseInt(quantity) || 1);
    const ev = parseFloat(estimated_value) || 0;
    const unit = ['hourly', 'daily', 'monthly'].includes(billing_unit) ? billing_unit : 'daily';

    const result = await dbRun(`
      INSERT INTO products (seller_id, title, description, category, images, daily_rent, deposit, location, quantity, estimated_value, latitude, longitude, billing_unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      authUser.id, title, description,
      category ?? '其他',
      JSON.stringify(images ?? []),
      daily_rent, deposit,
      location ?? '',
      qty, ev,
      latitude ?? null, longitude ?? null,
      unit,
    ]);

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
