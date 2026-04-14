'use client';

import { useEffect } from 'react';

import { refreshClientAuthInfo } from '@/lib/auth';

export function AuthSessionSync() {
  useEffect(() => {
    void refreshClientAuthInfo();
  }, []);

  return null;
}
