import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function ensureAdminDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }
  return adminDb.get();
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: goalId } = await params;
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const db = ensureAdminDb();
    const goalRef = db.collection('users', userId, 'carbonGoals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    await goalRef.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('carbon-goals DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}