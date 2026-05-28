import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbGet, dbRun, calcLateFee } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/orders/[id]/complete — seller completes rental or disputes damage */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await dbGet<any>('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    if (order.seller_id !== authUser.id) return NextResponse.json({ error: '僅賣家可確認歸還' }, { status: 403 });
    if (!['returning', 'active'].includes(order.status))
      return NextResponse.json({ error: '訂單狀態不允許此操作' }, { status: 400 });

    const { action, reason, returnPhotos } = await request.json();

    if (action === 'dispute') {
      await dbRun(
        "UPDATE orders SET status = 'disputed', compensation_requested = 1, compensation_reason = ?, return_seller_photos = ? WHERE id = ?",
        [reason ?? '', JSON.stringify(returnPhotos ?? []), id]
      );
      return NextResponse.json({ order: await dbGet('SELECT * FROM orders WHERE id = ?', [id]) });
    }

    const { fee } = calcLateFee(order.deposit, order.end_date);
    await dbRun(
      "UPDATE orders SET status = 'completed', late_fee = ?, return_seller_photos = ? WHERE id = ?",
      [fee, JSON.stringify(returnPhotos ?? []), id]
    );

    await dbRun(`
      UPDATE products SET status = 'available'
      WHERE id = ? AND (
        SELECT COUNT(*) FROM orders
        WHERE product_id = ? AND status IN ('pending','confirmed','handover','active','returning','disputed')
      ) = 0
    `, [order.product_id, order.product_id]);

    const updated = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);
    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
