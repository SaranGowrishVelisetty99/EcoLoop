import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { getUidFromAuthHeader } from '@/lib/auth-verify';

function ensureAdminDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }
  return adminDb.get();
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('[API carbon-goals GET] Auth header present:', !!authHeader, 'length:', authHeader?.length);
    
    let uid: string;
    try {
      uid = await getUidFromAuthHeader(authHeader);
    } catch (e) {
      console.error('[API carbon-goals GET] Auth failed:', e);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = ensureAdminDb();
    const userRef = db.collection('users').doc(uid);
    const goalsRef = userRef.collection('carbonGoals');
    
    console.log('[API carbon-goals GET] userId:', uid, 'path:', goalsRef.path);
    
    const snapshot = await goalsRef.orderBy('createdAt', 'desc').get();

    console.log('[API carbon-goals GET] userId:', uid, 'docs count:', snapshot.docs.length);

    interface GoalDoc {
      id: string;
      data: () => { createdAt?: { toDate: () => Date }; targetDate?: { toDate: () => Date }; [key: string]: unknown };
    }

    const goals = snapshot.docs
      .map((doc: GoalDoc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        targetDate: doc.data().targetDate?.toDate?.() || new Date(),
      }));

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
    let uid: string;
    try {
      uid = await getUidFromAuthHeader(request.headers.get('authorization'));
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetReductionPercentage, targetDate, baselineTotalKgCo2 } = body;

    console.log('[API carbon-goals POST] userId:', uid, 'body:', body);

    if (!targetReductionPercentage || !targetDate || !baselineTotalKgCo2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = ensureAdminDb();
    
    // Verify user document exists before creating subcollection
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  
    const goalsRef = userRef.collection('carbonGoals');
    
    console.log('[API carbon-goals POST] userId:', uid, 'path:', goalsRef.path);
    
    const goalData = {
      userId: uid,
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