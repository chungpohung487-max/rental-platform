import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbRun } from '@/lib/db';

/** POST /api/auth/verify-phone — verify OTP code */
export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();
    if (!phone || !otp) return NextResponse.json({ error: '缺少參數' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await dbGet<any>(
      "SELECT * FROM phone_otps WHERE phone = ? AND used = 0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1",
      [phone]
    );

    if (!record || record.otp !== otp)
      return NextResponse.json({ error: '驗證碼錯誤或已過期' }, { status: 400 });

    await dbRun('UPDATE phone_otps SET used = 1 WHERE id = ?', [record.id]);
    return NextResponse.json({ success: true, verified_phone: phone });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
