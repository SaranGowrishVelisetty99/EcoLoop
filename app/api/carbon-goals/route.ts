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
    const userRef = db.collection('users').doc(userId);
    const goalsRef = userRef.collection('carbonGoals');
    
    console.log('[API carbon-goals GET] userId:', userId, 'path:', goalsRef.path);
    
    const snapshot = await goalsRef.orderBy('createdAt', 'desc').get();

    console.log('[API carbon-goals GET] userId:', userId, 'docs count:', snapshot.docs.length);

    const goals = snapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        targetDate: doc.data().targetDate?.toDate?.() || new Date(),
      }))
      // Filter out goals that don't belong to the current user (data integrity fix)
      .filter((goal: any) => goal.userId === userId);

    return NextResponse.json({ goals }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('carbon-goals GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, targetReductionPercentage, targetDate, baselineTotalKgCo2 } = body;

    console.log('[API carbon-goals POST] userId:', userId, 'body:', body);

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ error: 'Invalid userId: must be a non-empty string' }, { status: 400 });
    }
    if (!targetReductionPercentage || !targetDate || !baselineTotalKgCo2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = ensureAdminDb();
    
    // Verify user document exists before creating subcollection
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
 
    const goalsRef = userRef.collection('carbonGoals');
    
    console.log('[API carbon-goals POST] userId:', userId, 'path:', goalsRef.path);
    
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