import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { put } from '@vercel/blob';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const IMAGE_MAX = 5 * 1024 * 1024;   // 5 MB
const VIDEO_MAX = 100 * 1024 * 1024; // 100 MB

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '請先登入' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: '請選擇檔案' }, { status: 400 });

    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo)
      return NextResponse.json({ error: '只支援圖片（JPG/PNG/WebP）或影片（MP4/MOV/WebM）格式' }, { status: 400 });

    const maxSize = isImage ? IMAGE_MAX : VIDEO_MAX;
    if (file.size > maxSize)
      return NextResponse.json({ error: `檔案大小不能超過 ${isImage ? '5MB' : '100MB'}` }, { status: 400 });

    const ext = file.name.split('.').pop() ?? (isImage ? 'jpg' : 'mp4');
    const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url, type: isImage ? 'image' : 'video' });
  } catch {
    return NextResponse.json({ error: '上傳失敗' }, { status: 500 });
  }
}
