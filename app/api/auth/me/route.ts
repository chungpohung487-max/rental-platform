import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbGet } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const user = await dbGet(
    'SELECT id, name, email, avatar, bio, rating, rating_count, created_at FROM users WHERE id = ?',
    [authUser.id]
  );

  if (!user) return NextResponse.json({ error: '用戶不存在' }, { status: 404 });
  return NextResponse.json({ user });
}
