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
    
    console.log('[API carbon-goals DELETE] goalId:', goalId, 'userId:', userId);
    
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ error: 'Invalid userId: must be a non-empty string' }, { status: 400 });
    }

    const db = ensureAdminDb();
    
    // Verify user document exists
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const goalRef = userRef.collection('carbonGoals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Verify goal belongs to the user
    const goalData = goalDoc.data();
    if (goalData?.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: goal does not belong to user' }, { status: 403 });
    }

    await goalRef.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('carbon-goals DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}