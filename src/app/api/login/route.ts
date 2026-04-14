import { NextRequest, NextResponse } from 'next/server';

import { type AuthCookiePayload, type UserRole } from '@/lib/auth';
import {
  AUTH_COOKIE_NAME,
  AUTH_MAX_AGE_MS,
  generateAuthSignature,
} from '@/lib/auth.server';
import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';
import { logError } from '@/lib/logger';
import { isHashed, verifyPassword } from '@/lib/password';

export const runtime = 'nodejs';

function isOwnerPasswordValid(password: string): boolean {
  const configuredPassword = process.env.PASSWORD;
  if (!configuredPassword) {
    return false;
  }

  if (isHashed(configuredPassword)) {
    return verifyPassword(password, configuredPassword);
  }

  return password === configuredPassword;
}

async function generateAuthCookie(
  username: string,
): Promise<string> {
  const timestamp = Date.now();
  const signature = await generateAuthSignature(
    username,
    timestamp,
    process.env.PASSWORD || '',
  );

  const authData: AuthCookiePayload = {
    username,
    signature,
    timestamp,
  };

  return encodeURIComponent(JSON.stringify(authData));
}

async function buildLoginResponse(
  username: string,
  role: UserRole,
): Promise<NextResponse> {
  const response = NextResponse.json({
    ok: true,
    session: {
      username,
      role,
    },
  });
  const cookieValue = await generateAuthCookie(username);
  const expires = new Date(Date.now() + AUTH_MAX_AGE_MS);

  response.cookies.set(AUTH_COOKIE_NAME, cookieValue, {
    path: '/',
    expires,
    sameSite: 'lax',
    httpOnly: true,
    secure: false,
  });

  return response;
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
    }

    // 可能是站长，直接读环境变量
    if (username === process.env.USERNAME && isOwnerPasswordValid(password)) {
      return buildLoginResponse(username, 'owner');
    } else if (username === process.env.USERNAME) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const config = await getConfig();
    const user = config.UserConfig.Users.find((u) => u.username === username);
    if (user && user.banned) {
      return NextResponse.json({ error: '用户被封禁' }, { status: 401 });
    }

    // 校验用户密码
    try {
      const pass = await db.verifyUser(username, password);
      if (!pass) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 },
        );
      }

      return buildLoginResponse(username, user?.role || 'user');
    } catch (err) {
      logError('数据库验证失败', err);
      return NextResponse.json({ error: '数据库错误' }, { status: 500 });
    }
  } catch (error) {
    logError('登录接口异常', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
