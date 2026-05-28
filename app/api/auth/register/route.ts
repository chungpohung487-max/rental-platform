import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbGet, dbRun } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password || !phone)
      return NextResponse.json({ error: '請填寫所有必填欄位（含手機號碼）' }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: '密碼至少需要6個字元' }, { status: 400 });
    if (!/^09\d{8}$/.test(phone))
      return NextResponse.json({ error: '請輸入正確的台灣手機號碼' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const otpRecord = await dbGet<any>(
      'SELECT id FROM phone_otps WHERE phone = ? AND used = 1 ORDER BY id DESC LIMIT 1',
      [phone]
    );
    if (!otpRecord)
      return NextResponse.json({ error: '請先完成手機號碼驗證' }, { status: 400 });

    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return NextResponse.json({ error: '此電子郵件已被使用' }, { status: 409 });

    const phoneUsed = await dbGet('SELECT id FROM users WHERE phone = ?', [phone]);
    if (phoneUsed) return NextResponse.json({ error: '此手機號碼已被使用' }, { status: 409 });

    const hashed = bcrypt.hashSync(password, 10);
    const result = await dbRun(
      'INSERT INTO users (name, email, password, phone, phone_verified) VALUES (?, ?, ?, ?, 1)',
      [name, email, hashed, phone]
    );

    const id = Number(result.lastInsertRowid);
    const token = await signToken({ id, email, name });

    return NextResponse.json({ token, user: { id, email, name } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
