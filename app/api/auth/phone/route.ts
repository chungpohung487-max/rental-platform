import { NextRequest, NextResponse } from 'next/server';
import { dbRun } from '@/lib/db';

/** POST /api/auth/phone — send OTP to phone (simulated in demo mode) */
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone || !/^09\d{8}$/.test(phone))
      return NextResponse.json({ error: '請輸入正確的台灣手機號碼（09開頭，共10碼）' }, { status: 400 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await dbRun('DELETE FROM phone_otps WHERE phone = ?', [phone]);
    await dbRun('INSERT INTO phone_otps (phone, otp, expires_at) VALUES (?, ?, ?)', [phone, otp, expiresAt]);

    // Demo mode: return OTP in response
    return NextResponse.json({
      success: true,
      demo_otp: otp,
      message: `驗證碼已發送至 ${phone}`,
    });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
