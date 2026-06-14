import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getUidFromAuthHeader } from '@/lib/auth-verify';

interface FirestoreDoc {
  ref: FirebaseFirestore.DocumentReference;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scanId } = await params;

    let uid: string;
    try {
      uid = await getUidFromAuthHeader(request.headers.get('authorization'));
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = ensureAdminDb();

    const scanRef = db.collection('scans').doc(scanId);
    const scanDoc = await scanRef.get();

    if (!scanDoc.exists) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    const scanData = scanDoc.data();
    if (scanData?.userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const batch = db.batch();

    batch.delete(scanRef);

    const projectsQuery = db.collection('userProjects').where('scanId', '==', scanId);
    const projectsSnapshot = await projectsQuery.get();
    projectsSnapshot.docs.forEach((doc: FirestoreDoc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({ ok: true, deletedScanId: scanId, deletedProjectsCount: projectsSnapshot.docs.length });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string } | Error;
    console.error('delete-scan error:', error);
    return NextResponse.json({ error: 'Failed to delete scan', details: err.message }, { status: 500 });
  }
}

function ensureAdminDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized. Set FIREBASE_ADMIN_SERVICE_ACCOUNT env var or run gcloud auth application-default login.');
  }
  return adminDb.get();
}