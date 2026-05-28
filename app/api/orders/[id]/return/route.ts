import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbGet, dbRun } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/orders/[id]/return — buyer uploads return photos and initiates return */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await dbGet<any>('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    if (order.buyer_id !== authUser.id) return NextResponse.json({ error: '僅買家可發起歸還' }, { status: 403 });
    if (order.status !== 'active') return NextResponse.json({ error: '訂單狀態不允許此操作' }, { status: 400 });

    const { media } = await request.json();
    if (!Array.isArray(media) || media.length === 0)
      return NextResponse.json({ error: '請上傳歸還照片' }, { status: 400 });

    await dbRun(
      "UPDATE orders SET status = 'returning', return_buyer_photos = ? WHERE id = ?",
      [JSON.stringify(media), id]
    );

    const updated = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);
    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
