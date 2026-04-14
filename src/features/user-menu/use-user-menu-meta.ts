'use client';

import { useEffect, useState } from 'react';

import { getClientAuthInfo, refreshClientAuthInfo, type ClientAuthInfo } from '@/lib/auth';

export const useUserMenuMeta = () => {
  const [authInfo, setAuthInfo] = useState<ClientAuthInfo | null>(() =>
    getClientAuthInfo(),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    refreshClientAuthInfo().then((auth) => {
      if (active) {
        setAuthInfo(auth);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return {
    authInfo,
    mounted,
  };
};
