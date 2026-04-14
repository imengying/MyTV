import type { NextRequest } from 'next/server';

import { getAuthInfoFromCookie } from './auth';

export const AUTH_COOKIE_NAME = 'auth';
export const AUTH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const AUTH_MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

function buildSignedPayload(username: string, timestamp: number): string {
  return `${username}:${timestamp}`;
}

export async function generateAuthSignature(
  username: string,
  timestamp: number,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(buildSignedPayload(username, timestamp));

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyAuthSignature(
  username: string,
  timestamp: number,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(buildSignedPayload(username, timestamp));

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const signatureBuffer = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
    );

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      messageData,
    );
  } catch {
    return false;
  }
}

export function isAuthTimestampValid(
  timestamp: number,
  now = Date.now(),
): boolean {
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  if (timestamp > now + AUTH_MAX_FUTURE_SKEW_MS) {
    return false;
  }

  return now - timestamp <= AUTH_MAX_AGE_MS;
}

export async function getValidatedAuthInfoFromCookie(
  request: NextRequest,
): Promise<{ username: string; timestamp: number } | null> {
  const authInfo = getAuthInfoFromCookie(request);

  if (
    !authInfo?.username ||
    !authInfo.signature ||
    typeof authInfo.timestamp !== 'number'
  ) {
    return null;
  }

  if (!isAuthTimestampValid(authInfo.timestamp)) {
    return null;
  }

  const secret = process.env.PASSWORD;
  if (!secret) {
    return null;
  }

  const isValidSignature = await verifyAuthSignature(
    authInfo.username,
    authInfo.timestamp,
    authInfo.signature,
    secret,
  );

  if (!isValidSignature) {
    return null;
  }

  return {
    username: authInfo.username,
    timestamp: authInfo.timestamp,
  };
}
