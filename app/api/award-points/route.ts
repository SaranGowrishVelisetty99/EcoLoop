import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, points } = body as { projectId?: string; points?: number };

    if (!projectId || !points) {
      return NextResponse.json({ error: 'Missing projectId or points' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer /i, '');
    const decoded = decodeJwtPayload(token);
    if (!decoded?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = ensureAdminDb();

    const projectRef = db.collection('userProjects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectData = projectDoc.data();
    if (projectData?.userId !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (projectData?.status !== 'completed') {
      return NextResponse.json({ error: 'Project not completed' }, { status: 400 });
    }

    if (projectData?.pointsAwarded) {
      return NextResponse.json({ error: 'Points already awarded' }, { status: 400 });
    }

    await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(decoded.uid);
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
  return adminDb;
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';

    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    return { ...payload, uid: payload.uid || payload.user_id || payload.sub };
  } catch {
    return null;
  }
}