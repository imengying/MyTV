/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import {
  AUTH_COOKIE_NAME,
  getValidatedAuthInfoFromCookie,
} from '@/lib/auth.server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkipAuth(pathname)) {
    return NextResponse.next();
  }

  if (!process.env.PASSWORD) {
    const warningUrl = new URL('/warning', request.url);
    return NextResponse.redirect(warningUrl);
  }

  const authInfo = await getValidatedAuthInfoFromCookie(request);

  if (authInfo) {
    return NextResponse.next();
  }

  return handleAuthFailure(request, pathname);
}

function handleAuthFailure(
  request: NextRequest,
  pathname: string,
): NextResponse {
  const response = pathname.startsWith('/api')
    ? new NextResponse('Unauthorized', { status: 401 })
    : (() => {
        const loginUrl = new URL('/login', request.url);
        const fullUrl = `${pathname}${request.nextUrl.search}`;
        loginUrl.searchParams.set('redirect', fullUrl);
        return NextResponse.redirect(loginUrl);
      })();

  response.cookies.set(AUTH_COOKIE_NAME, '', {
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
    httpOnly: true,
    secure: false,
  });

  if (pathname.startsWith('/api')) {
    return response;
  }

  return response;
}

function shouldSkipAuth(pathname: string): boolean {
  const skipPaths = [
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/icons/',
    '/logo.svg',
    '/screenshot.png',
  ];

  return skipPaths.some((path) => pathname.startsWith(path));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|warning|api/login|api/register|api/logout|api/cron|api/server-config).*)',
  ],
};
