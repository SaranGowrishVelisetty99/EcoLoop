import { POST } from './route';
import { NextRequest } from 'next/server';

const mockDb = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  add: jest.fn().mockResolvedValue({ id: 'new-id' }),
  get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ userId: 'user-123' }) }),
  update: jest.fn().mockResolvedValue({}),
};

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: { get: () => mockDb },
  adminFieldValue: {
    serverTimestamp: jest.fn(),
    increment: jest.fn(),
  },
}));

jest.mock('@/lib/auth-verify', () => ({
  getUidFromAuthHeader: jest.fn().mockRejectedValue(new Error('Invalid token')),
}));

describe('/api/scan integration', () => {
  it('should return 401 if unauthorized', async () => {
    const request = new NextRequest('http://localhost/api/scan', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid' }
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});