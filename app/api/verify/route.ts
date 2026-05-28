import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbGet, dbRun } from '@/lib/db';

/** GET /api/verify — get my verification status */
export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    const user = await dbGet<{ verified: number }>('SELECT verified FROM users WHERE id = ?', [authUser.id]);
    const req = await dbGet('SELECT * FROM verify_requests WHERE user_id = ?', [authUser.id]);
    return NextResponse.json({ verified: user?.verified ?? 0, request: req ?? null });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

/** POST /api/verify — apply for verification */
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await dbGet<any>('SELECT verified FROM users WHERE id = ?', [authUser.id]);
  if (user?.verified === 1) return NextResponse.json({ error: '您已是認證商家' }, { status: 400 });

  const existing = await dbGet<{ status: string }>('SELECT status FROM verify_requests WHERE user_id = ?', [authUser.id]);
  if (existing?.status === 'pending') return NextResponse.json({ error: '申請審核中，請耐心等候' }, { status: 400 });

  try {
    const { reason } = await request.json();
    if (existing) {
      await dbRun("UPDATE verify_requests SET reason = ?, status = 'pending', created_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        [reason ?? '', authUser.id]);
    } else {
      await dbRun('INSERT INTO verify_requests (user_id, reason) VALUES (?, ?)', [authUser.id, reason ?? '']);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
