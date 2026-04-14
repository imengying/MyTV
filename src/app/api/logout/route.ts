import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME } from '@/lib/auth.server';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ ok: true });

  // 清除认证cookie
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
    httpOnly: true,
    secure: false, // 根据协议自动设置
  });

  return response;
}
