import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbGet, dbAll, dbRun, getAvailableQty } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = await dbGet<any>(`
    SELECT p.*,
      u.name as seller_name, u.rating as seller_rating,
      u.rating_count as seller_rating_count, u.bio as seller_bio,
      u.verified as seller_verified
    FROM products p JOIN users u ON p.seller_id = u.id
    WHERE p.id = ?
  `, [id]);

  if (!product) return NextResponse.json({ error: '商品不存在' }, { status: 404 });

  product.available_quantity = await getAvailableQty(product.id, product.quantity);

  const reviews = await dbAll(`
    SELECT r.*, u.name as reviewer_name
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    JOIN orders o ON r.order_id = o.id
    WHERE o.product_id = ? AND r.review_type = 'as_buyer'
    ORDER BY r.created_at DESC LIMIT 10
  `, [id]);

  return NextResponse.json({ product, reviews });
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = await dbGet<any>('SELECT * FROM products WHERE id = ?', [id]);
  if (!product) return NextResponse.json({ error: '商品不存在' }, { status: 404 });
  if (product.seller_id !== authUser.id) return NextResponse.json({ error: '無權限' }, { status: 403 });

  try {
    const body = await request.json();
    const qty = body.quantity != null ? Math.max(1, parseInt(body.quantity) || 1) : product.quantity;
    const unit = body.billing_unit && ['hourly','daily','monthly'].includes(body.billing_unit)
      ? body.billing_unit : product.billing_unit ?? 'daily';
    await dbRun(`
      UPDATE products SET title=?, description=?, category=?, images=?,
        daily_rent=?, deposit=?, location=?, quantity=?, status=?, billing_unit=? WHERE id=?
    `, [
      body.title ?? product.title,
      body.description ?? product.description,
      body.category ?? product.category,
      body.images ? JSON.stringify(body.images) : product.images,
      body.daily_rent ?? product.daily_rent,
      body.deposit ?? product.deposit,
      body.location ?? product.location,
      qty,
      body.status ?? product.status,
      unit,
      id,
    ]);

    const updated = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = await dbGet<any>('SELECT * FROM products WHERE id = ?', [id]);
  if (!product) return NextResponse.json({ error: '商品不存在' }, { status: 404 });
  if (product.seller_id !== authUser.id) return NextResponse.json({ error: '無權限' }, { status: 403 });

  const active = await dbGet(
    "SELECT id FROM orders WHERE product_id = ? AND status IN ('pending','active')",
    [id]
  );
  if (active) return NextResponse.json({ error: '商品有進行中的訂單，無法刪除' }, { status: 400 });

  await dbRun('DELETE FROM products WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}
