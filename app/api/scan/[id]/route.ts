import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebase-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scanId } = await params;

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

    const scanRef = db.collection('scans').doc(scanId);
    const scanDoc = await scanRef.get();

    if (!scanDoc.exists) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    const scanData = scanDoc.data();
    if (scanData?.userId !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const batch = db.batch();

    batch.delete(scanRef);

    const projectsQuery = db.collection('userProjects').where('scanId', '==', scanId);
    const projectsSnapshot = await projectsQuery.get();
    projectsSnapshot.docs.forEach((doc) => {
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