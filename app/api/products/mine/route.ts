import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbAll } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const products = await dbAll(
    'SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC',
    [authUser.id]
  );

  return NextResponse.json({ products });
}
