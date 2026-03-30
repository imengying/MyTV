import { NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';
import { CURRENT_VERSION } from '@/lib/version';

export const runtime = 'nodejs';

export async function GET() {
  const config = await getConfig();
  const result = {
    SiteName: config.SiteConfig.SiteName,
    Version: CURRENT_VERSION,
  };
  return NextResponse.json(result);
}
