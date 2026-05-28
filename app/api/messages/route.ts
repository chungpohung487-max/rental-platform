import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbGet, dbAll, dbRun } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const orderId = new URL(request.url).searchParams.get('order_id');
  if (!orderId) return NextResponse.json({ error: '缺少 order_id' }, { status: 400 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await dbGet<any>('SELECT buyer_id, seller_id FROM orders WHERE id = ?', [orderId]);
    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    if (order.buyer_id !== authUser.id && order.seller_id !== authUser.id)
      return NextResponse.json({ error: '無權限' }, { status: 403 });

    const messages = await dbAll(`
      SELECT m.*, u.name as sender_name
      FROM messages m JOIN users u ON m.sender_id = u.id
      WHERE m.order_id = ?
      ORDER BY m.created_at ASC
    `, [orderId]);

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    const { order_id, content } = await request.json();
    if (!order_id || !content?.trim()) return NextResponse.json({ error: '內容不能為空' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await dbGet<any>('SELECT buyer_id, seller_id FROM orders WHERE id = ?', [order_id]);
    if (!order) return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
    if (order.buyer_id !== authUser.id && order.seller_id !== authUser.id)
      return NextResponse.json({ error: '無權限' }, { status: 403 });

    const result = await dbRun(
      'INSERT INTO messages (order_id, sender_id, content) VALUES (?, ?, ?)',
      [order_id, authUser.id, content.trim()]
    );

    const message = await dbGet(`
      SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?
    `, [result.lastInsertRowid]);

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
