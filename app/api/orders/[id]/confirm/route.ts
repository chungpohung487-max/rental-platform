import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbGet, dbRun } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/orders/[id]/confirm — buyer or seller confirms the rental */
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
    if (order.status !== 'confirmed') return NextResponse.json({ error: '訂單狀態不允許此操作' }, { status: 400 });

    if (isBuyer) {
      await dbRun('UPDATE orders SET buyer_confirmed = 1 WHERE id = ?', [id]);
    } else {
      await dbRun('UPDATE orders SET seller_confirmed = 1 WHERE id = ?', [id]);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await dbGet<any>('SELECT * FROM orders WHERE id = ?', [id]);
    if (updated.buyer_confirmed && updated.seller_confirmed) {
      await dbRun("UPDATE orders SET status = 'handover' WHERE id = ?", [id]);
    }

    const final = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);
    return NextResponse.json({ order: final });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
