import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

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

    await projectRef.delete();

    return NextResponse.json({ ok: true, deletedProjectId: projectId });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string } | Error;
    console.error('delete-project error:', error);
    return NextResponse.json({ error: 'Failed to delete project', details: err.message }, { status: 500 });
  }
}

function ensureAdminDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized. Set FIREBASE_ADMIN_SERVICE_ACCOUNT env var or run gcloud auth application-default login.');
  }
  return adminDb.get();
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