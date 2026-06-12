import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = ensureAdminDb();

    const usersRef = db.collection('users');
    const snapshot = await usersRef.limit(100).get();

    const leaderboard = snapshot.docs
      .map((doc: any) => ({
        uid: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
      .slice(0, 50);

    return NextResponse.json({ leaderboard });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string } | Error;
    console.error('leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard', details: err.message }, { status: 500 });
  }
}

function ensureAdminDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized. Set FIREBASE_ADMIN_SERVICE_ACCOUNT env var or run gcloud auth application-default login.');
  }
  return adminDb.get();
}