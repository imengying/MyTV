import { NextRequest, NextResponse } from 'next/server';

import { type UserRole } from '@/lib/auth';
import { getValidatedAuthInfoFromCookie } from '@/lib/auth.server';
import { getConfig } from '@/lib/config';

export const runtime = 'nodejs';

async function resolveUserRole(username: string): Promise<UserRole | null> {
  if (username === process.env.USERNAME) {
    return 'owner';
  }

  const config = await getConfig();
  const user = config.UserConfig.Users.find((item) => item.username === username);

  if (!user || user.banned) {
    return null;
  }

  return user.role === 'admin' ? 'admin' : 'user';
}

export async function GET(request: NextRequest) {
  const authInfo = await getValidatedAuthInfoFromCookie(request);

  if (!authInfo) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await resolveUserRole(authInfo.username);
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    {
      username: authInfo.username,
      role,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
