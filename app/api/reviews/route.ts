import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbGet, dbRun } from '@/lib/db';

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    const { order_id, rating, comment } = await request.json();

    if (!order_id || !rating)
      return NextResponse.json({ error: '請填寫評分' }, { status: 400 });
    if (rating < 1 || rating > 5)
      return NextResponse.json({ error: '評分需在1到5之間' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await dbGet<any>('SELECT * FROM orders WHERE id = ?', [order_id]);

    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    if (order.status !== 'completed')
      return NextResponse.json({ error: '訂單尚未完成，無法評價' }, { status: 400 });

    const isBuyer = order.buyer_id === authUser.id;
    const isSeller = order.seller_id === authUser.id;

    if (!isBuyer && !isSeller) return NextResponse.json({ error: '無權限' }, { status: 403 });
    if (isBuyer && order.buyer_reviewed) return NextResponse.json({ error: '您已評價過此訂單' }, { status: 400 });
    if (isSeller && order.seller_reviewed) return NextResponse.json({ error: '您已評價過此訂單' }, { status: 400 });

    const revieweeId = isBuyer ? order.seller_id : order.buyer_id;
    const reviewType = isBuyer ? 'as_buyer' : 'as_seller';

    await dbRun(
      'INSERT INTO reviews (order_id, reviewer_id, reviewee_id, rating, comment, review_type) VALUES (?, ?, ?, ?, ?, ?)',
      [order_id, authUser.id, revieweeId, rating, comment ?? '', reviewType]
    );

    if (isBuyer) {
      await dbRun('UPDATE orders SET buyer_reviewed = 1 WHERE id = ?', [order_id]);
    } else {
      await dbRun('UPDATE orders SET seller_reviewed = 1 WHERE id = ?', [order_id]);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = await dbGet<any>(
      'SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE reviewee_id = ?',
      [revieweeId]
    );

    await dbRun('UPDATE users SET rating = ?, rating_count = ? WHERE id = ?',
      [stats?.avg ?? 0, stats?.cnt ?? 0, revieweeId]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
