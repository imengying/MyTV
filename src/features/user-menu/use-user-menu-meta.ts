'use client';

import { useEffect, useState } from 'react';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';

interface AuthInfo {
  username?: string;
  role?: 'owner' | 'admin' | 'user';
}

export const useUserMenuMeta = () => {
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = getAuthInfoFromBrowserCookie();
    setAuthInfo(auth);
  }, []);

  return {
    authInfo,
    mounted,
  };
};
