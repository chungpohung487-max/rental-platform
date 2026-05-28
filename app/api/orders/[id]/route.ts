import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbGet, dbRun } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await dbGet<any>(`
    SELECT o.*, p.title as product_title, p.images as product_images, p.location as product_location,
           p.daily_rent, buyer.name as buyer_name, seller.name as seller_name
    FROM orders o
    JOIN products p ON o.product_id = p.id
    JOIN users buyer ON o.buyer_id = buyer.id
    JOIN users seller ON o.seller_id = seller.id
    WHERE o.id = ?
  `, [id]);

  if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
  if (order.buyer_id !== authUser.id && order.seller_id !== authUser.id)
    return NextResponse.json({ error: '無權限' }, { status: 403 });

  return NextResponse.json({ order });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await dbGet<any>('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
  if (order.buyer_id !== authUser.id && order.seller_id !== authUser.id)
    return NextResponse.json({ error: '無權限' }, { status: 403 });

  const { status } = await request.json();

  if (order.buyer_id !== authUser.id)
    return NextResponse.json({ error: '無權限執行此操作' }, { status: 403 });

  const allowed: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['cancelled'],
  };

  if (!allowed[order.status]?.includes(status))
    return NextResponse.json({ error: '無效的狀態變更' }, { status: 400 });

  await dbRun('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

  if (status === 'cancelled') {
    await dbRun(`
      UPDATE products SET status = 'available'
      WHERE id = ? AND (
        SELECT COUNT(*) FROM orders
        WHERE product_id = ? AND status IN ('pending','confirmed','handover','active','returning','disputed')
      ) = 0
    `, [order.product_id, order.product_id]);
  }

  const updated = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);
  return NextResponse.json({ order: updated });
}
