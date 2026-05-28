import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbAll, dbRun } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const notifications = await dbAll(`
    SELECT * FROM notifications WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 30
  `, [authUser.id]);

  const unread = (notifications as { is_read: number }[]).filter(n => !n.is_read).length;
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  await dbRun('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [authUser.id]);
  return NextResponse.json({ success: true });
}
