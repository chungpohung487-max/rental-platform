import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbGet, dbRun } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/orders/[id]/handover — upload handover photos/videos */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await dbGet<any>('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });

    const isBuyer = order.buyer_id === authUser.id;
    const isSeller = order.seller_id === authUser.id;
    if (!isBuyer && !isSeller) return NextResponse.json({ error: '無權限' }, { status: 403 });
    if (order.status !== 'handover') return NextResponse.json({ error: '訂單狀態不允許此操作' }, { status: 400 });

    const { media } = await request.json();
    if (!Array.isArray(media) || media.length === 0)
      return NextResponse.json({ error: '請至少上傳一張照片' }, { status: 400 });

    const field = isBuyer ? 'handover_buyer_photos' : 'handover_seller_photos';
    await dbRun(`UPDATE orders SET ${field} = ? WHERE id = ?`, [JSON.stringify(media), id]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await dbGet<any>('SELECT * FROM orders WHERE id = ?', [id]);
    const buyerDone = JSON.parse(updated.handover_buyer_photos || '[]').length > 0;
    const sellerDone = JSON.parse(updated.handover_seller_photos || '[]').length > 0;

    if (buyerDone && sellerDone) {
      const today = new Date().toISOString().split('T')[0];
      await dbRun("UPDATE orders SET status = 'active', start_date = ? WHERE id = ?", [today, id]);
    }

    const final = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);
    return NextResponse.json({ order: final });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
