import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbAll, dbRun } from '@/lib/db';

/** GET /api/admin/verify — list all pending requests (admin: user id=1) */
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser || authUser.id !== 1) return NextResponse.json({ error: '無權限' }, { status: 403 });

  try {
    const requests = await dbAll(`
      SELECT vr.*, u.name, u.email, u.rating, u.rating_count
      FROM verify_requests vr JOIN users u ON vr.user_id = u.id
      ORDER BY vr.created_at DESC
    `);
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

/** POST /api/admin/verify — approve or reject (admin: user id=1) */
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser || authUser.id !== 1) return NextResponse.json({ error: '無權限' }, { status: 403 });

  try {
    const { user_id, action } = await request.json();
    if (!user_id || !['approve', 'reject'].includes(action))
      return NextResponse.json({ error: '參數錯誤' }, { status: 400 });

    const status = action === 'approve' ? 'approved' : 'rejected';
    await dbRun('UPDATE verify_requests SET status = ? WHERE user_id = ?', [status, user_id]);

    if (action === 'approve') {
      await dbRun('UPDATE users SET verified = 1 WHERE id = ?', [user_id]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
