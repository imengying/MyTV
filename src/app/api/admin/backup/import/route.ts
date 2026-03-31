/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { configSelfCheck, setCachedConfig } from '@/lib/config';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(req);
    if (!authInfo?.username) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (authInfo.username !== process.env.USERNAME) {
      return NextResponse.json(
        { error: '权限不足，只有站长可以导入数据' },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '请选择备份文件' }, { status: 400 });
    }

    const rawText = await file.text();

    let backupData: any;
    try {
      backupData = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: '备份文件不是有效的 JSON' }, { status: 400 });
    }

    if (!backupData?.data?.adminConfig || !backupData?.data?.userData) {
      return NextResponse.json({ error: '备份文件格式无效' }, { status: 400 });
    }

    await db.clearAllData();

    const adminConfig = configSelfCheck(backupData.data.adminConfig);
    await db.saveAdminConfig(adminConfig);
    await setCachedConfig(adminConfig);

    const userEntries = Object.entries(backupData.data.userData as Record<
      string,
      {
        passwordHash?: string;
        playRecords?: Record<string, any>;
        favorites?: Record<string, any>;
        searchHistory?: string[];
      }
    >);

    for (const [username, user] of userEntries) {
      if (typeof user.passwordHash === 'string' && user.passwordHash) {
        await db.registerUser(username, user.passwordHash);
      }

      if (user.playRecords) {
        for (const [key, record] of Object.entries(user.playRecords)) {
          const [source, id] = key.split('+');
          if (source && id) {
            await db.savePlayRecord(username, source, id, record as any);
          }
        }
      }

      if (user.favorites) {
        for (const [key, favorite] of Object.entries(user.favorites)) {
          const [source, id] = key.split('+');
          if (source && id) {
            await db.saveFavorite(username, source, id, favorite as any);
          }
        }
      }

      if (Array.isArray(user.searchHistory)) {
        for (const keyword of [...user.searchHistory].reverse()) {
          await db.addSearchHistory(username, keyword);
        }
      }
    }

    return NextResponse.json({
      message: '导入成功',
      importedUsers: userEntries.length,
      exportedAt: backupData.exportedAt || null,
      serverVersion: backupData.serverVersion || null,
    });
  } catch (error) {
    console.error('导入备份失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500 },
    );
  }
}
