import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dbAll, dbGet, dbRun, getAvailableQty } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  const role = new URL(request.url).searchParams.get('role') ?? 'buyer';

  const orders = role === 'buyer'
    ? await dbAll(`
        SELECT o.*, p.title as product_title, p.images as product_images, p.location as product_location,
               u.name as seller_name
        FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ? ORDER BY o.created_at DESC
      `, [authUser.id])
    : await dbAll(`
        SELECT o.*, p.title as product_title, p.images as product_images, p.location as product_location,
               u.name as buyer_name
        FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = ? ORDER BY o.created_at DESC
      `, [authUser.id]);

  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    const { product_id, start_date, end_date } = await request.json();

    if (!product_id || !start_date || !end_date)
      return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await dbGet<any>('SELECT * FROM products WHERE id = ?', [product_id]);

    if (!product) return NextResponse.json({ error: '商品不存在' }, { status: 404 });
    if (product.status !== 'available') return NextResponse.json({ error: '商品目前不可租借' }, { status: 400 });
    if (product.seller_id === authUser.id) return NextResponse.json({ error: '不能租借自己的商品' }, { status: 400 });

    const available = await getAvailableQty(product_id, product.quantity);
    if (available <= 0) return NextResponse.json({ error: '此商品目前已全數出租，無可用數量' }, { status: 400 });

    const billing_unit: string = product.billing_unit || 'daily';
    const startMs = new Date(start_date).getTime();
    const endMs = new Date(end_date).getTime();
    let periods: number;

    if (billing_unit === 'hourly') {
      periods = Math.ceil((endMs - startMs) / 3600000);
      if (periods < 1) return NextResponse.json({ error: '租借時間至少1小時' }, { status: 400 });
    } else if (billing_unit === 'monthly') {
      const s = new Date(start_date);
      const e = new Date(end_date);
      periods = Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
    } else {
      periods = Math.ceil((endMs - startMs) / 86400000);
      if (periods < 1) return NextResponse.json({ error: '租借天數至少1天' }, { status: 400 });
    }

    const totalRent = product.daily_rent * periods;
    const platformFee = Math.round(totalRent * 0.05 * 100) / 100;
    const sellerAmount = Math.round(totalRent * 0.95 * 100) / 100;
    const totalAmount = totalRent + platformFee + product.deposit;

    const result = await dbRun(`
      INSERT INTO orders (product_id, buyer_id, seller_id, start_date, end_date, days, billing_unit, total_rent, deposit, platform_fee, seller_amount, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [product_id, authUser.id, product.seller_id, start_date, end_date, periods, billing_unit, totalRent, product.deposit, platformFee, sellerAmount, totalAmount]);

    if (available - 1 <= 0) {
      await dbRun("UPDATE products SET status = 'rented' WHERE id = ?", [product_id]);
    }

    await dbRun(`
      INSERT INTO notifications (user_id, type, message, link)
      VALUES (?, 'order', ?, '/my/lending')
    `, [product.seller_id, `收到新的租借申請：${product.title}`]);

    const order = await dbGet('SELECT * FROM orders WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
