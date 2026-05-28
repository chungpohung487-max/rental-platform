import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbGet } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password)
      return NextResponse.json({ error: '請填寫電子郵件和密碼' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await dbGet<any>('SELECT * FROM users WHERE email = ?', [email]);

    if (!user || !bcrypt.compareSync(password, user.password))
      return NextResponse.json({ error: '電子郵件或密碼錯誤' }, { status: 401 });

    const token = await signToken({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
