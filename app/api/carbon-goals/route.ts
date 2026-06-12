import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebase-admin';

function ensureAdminDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }
  return adminDb.get();
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const db = ensureAdminDb();
    const goalsRef = db.collection('users', userId, 'carbonGoals');
    const snapshot = await goalsRef.orderBy('createdAt', 'desc').get();

    const goals = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      targetDate: doc.data().targetDate?.toDate?.() || new Date(),
    }));

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('carbon-goals GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, targetReductionPercentage, targetDate, baselineTotalKgCo2 } = body;

    if (!userId || !targetReductionPercentage || !targetDate || !baselineTotalKgCo2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = ensureAdminDb();
    const goalsRef = db.collection('users', userId, 'carbonGoals');
    
    const goalData = {
      userId,
      targetReductionPercentage,
      targetDate: new Date(targetDate),
      baselineTotalKgCo2,
      currentTotalKgCo2: baselineTotalKgCo2,
      status: 'active' as const,
      createdAt: adminFieldValue.serverTimestamp(),
    };

    const docRef = await goalsRef.add(goalData);
    const goal = await docRef.get();

    return NextResponse.json({ 
      goal: { id: docRef.id, ...goal.data(), createdAt: goal.data()?.createdAt?.toDate?.() || new Date() } 
    });
  } catch (error) {
    console.error('carbon-goals POST error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}