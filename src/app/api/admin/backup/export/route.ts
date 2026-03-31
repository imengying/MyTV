/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { CURRENT_VERSION } from '@/lib/version';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(req);
    if (!authInfo?.username) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (authInfo.username !== process.env.USERNAME) {
      return NextResponse.json(
        { error: '权限不足，只有站长可以导出数据' },
        { status: 401 },
      );
    }

    const adminConfig = await db.getAdminConfig();
    if (!adminConfig) {
      return NextResponse.json({ error: '无法获取配置' }, { status: 500 });
    }

    let allUsers = await db.getAllUsers();
    if (process.env.USERNAME) {
      allUsers.push(process.env.USERNAME);
    }
    allUsers = Array.from(new Set(allUsers));

    const userData: Record<string, any> = {};

    for (const username of allUsers) {
      userData[username] = {
        passwordHash: await db.getStoredPassword(username),
        playRecords: await db.getAllPlayRecords(username),
        favorites: await db.getAllFavorites(username),
        searchHistory: await db.getSearchHistory(username),
      };
    }

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      serverVersion: CURRENT_VERSION,
      data: {
        adminConfig,
        userData,
      },
    };

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `mytv-backup-${timestamp}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('导出备份失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导出失败' },
      { status: 500 },
    );
  }
}
