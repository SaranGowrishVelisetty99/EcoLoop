import { getAdminAuth } from '@/lib/firebase-admin';

export async function verifyIdToken(token: string) {
  const auth = getAdminAuth();
  if (!auth) {
    console.error('[auth-verify] Firebase Admin Auth not initialized');
    throw new Error('Firebase Admin Auth not initialized');
  }
  try {
    return await auth.verifyIdToken(token);
  } catch (e) {
    console.error('[auth-verify] Token verification failed:', e);
    throw e;
  }
}

export async function getUidFromAuthHeader(authHeader: string | null): Promise<string> {
  if (!authHeader) {
    console.error('[auth-verify] Missing authorization header');
    throw new Error('Missing authorization header');
  }
  const token = authHeader.replace(/^Bearer /i, '');
  console.log('[auth-verify] Verifying token, length:', token.length);
  const decoded = await verifyIdToken(token);
  console.log('[auth-verify] Token verified for uid:', decoded.uid);
  return decoded.uid;
}