import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getUidFromAuthHeader } from '@/lib/auth-verify';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

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