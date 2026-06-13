import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { getUidFromAuthHeader } from '@/lib/auth-verify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, points } = body as { projectId?: string; points?: number };

    if (!projectId || !points) {
      return NextResponse.json({ error: 'Missing projectId or points' }, { status: 400 });
    }

    let uid: string;
    try {
      uid = await getUidFromAuthHeader(request.headers.get('authorization'));
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = ensureAdminDb();

    const projectRef = db.collection('userProjects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectData = projectDoc.data();
    if (projectData?.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (projectData?.status !== 'completed') {
      return NextResponse.json({ error: 'Project not completed' }, { status: 400 });
    }

    if (projectData?.pointsAwarded) {
      return NextResponse.json({ error: 'Points already awarded' }, { status: 400 });
    }

    await db.runTransaction(async (transaction: any) => {
      const userRef = db.collection('users').doc(uid);
      transaction.update(userRef, {
        points: adminFieldValue.increment(points),
      });
      transaction.update(projectRef, {
        pointsAwarded: true,
        pointsAwardedAt: adminFieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true, pointsAwarded: points });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string } | Error;
    console.error('award-points error:', error);
    return NextResponse.json({ error: 'Failed to award points', details: err.message }, { status: 500 });
  }
}

function ensureAdminDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized. Set FIREBASE_ADMIN_SERVICE_ACCOUNT env var or run gcloud auth application-default login.');
  }
  return adminDb.get();
}