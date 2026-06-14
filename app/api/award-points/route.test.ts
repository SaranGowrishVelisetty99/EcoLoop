import { POST } from './route';
import { NextRequest } from 'next/server';

const mockDb = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({ 
    exists: true, 
    data: () => ({ userId: 'user-123', status: 'completed', pointsAwarded: false }) 
  }),
  runTransaction: jest.fn((cb) => cb({
    get: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
  })),
};

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: { get: () => mockDb },
  adminFieldValue: {
    serverTimestamp: jest.fn(),
    increment: jest.fn(),
  },
}));

jest.mock('@/lib/auth-verify', () => ({
  getUidFromAuthHeader: jest.fn().mockRejectedValue(new Error('Auth failed')),
}));

describe('/api/award-points', () => {
  it('should reject unauthorized requests', async () => {
    const request = new NextRequest('http://localhost/api/award-points', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid' },
      body: JSON.stringify({ projectId: 'proj-1', points: 50 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});