import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { UserDoc } from '@/types';

export interface UserService {
  getUser(uid: string): Promise<UserDoc | null>;
  createUser(uid: string, email: string, username?: string): Promise<void>;
  awardPoints(uid: string, points: number): Promise<number>;
  getLeaderboard(limit?: number): Promise<UserDoc[]>;
}

export function createUserService(db = adminDb, fieldValue = adminFieldValue): UserService {
  const usersCollection = db.collection('users');

  return {
    async getUser(uid: string): Promise<UserDoc | null> {
      const doc = await usersCollection.doc(uid).get();
      if (!doc.exists) return null;
      return { uid: doc.id, ...doc.data() } as UserDoc;
    },

    async createUser(uid: string, email: string, username?: string): Promise<void> {
      await usersCollection.doc(uid).set({
        uid,
        email,
        username: username || email,
        points: 0,
        createdAt: fieldValue.serverTimestamp(),
      }, { merge: true });
    },

    async awardPoints(uid: string, points: number): Promise<number> {
      const userRef = usersCollection.doc(uid);
      await db.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
        const userDoc = await transaction.get(userRef);
        const currentPoints = userDoc.exists ? (userDoc.data()?.points || 0) : 0;
        const newPoints = currentPoints + points;
        transaction.set(userRef, { points: newPoints }, { merge: true });
      });
      return points;
    },

    async getLeaderboard(limitCount = 50): Promise<UserDoc[]> {
      const query = usersCollection.orderBy('points', 'desc').limit(limitCount);
      const snapshot = await query.get();
      return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ uid: doc.id, ...doc.data() } as UserDoc));
    },
  };
}