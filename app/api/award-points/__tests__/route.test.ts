import { POST } from '../route';
import { createProjectService } from '@/services/projectService';
import { createUserService } from '@/services/userService';

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({
            userId: 'user-1',
            status: 'completed',
            pointsAwarded: false,
          }),
        })),
        update: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
    })),
    runTransaction: jest.fn((fn) => fn({
      get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ points: 100 }) })),
      set: jest.fn(),
      update: jest.fn(),
    })),
  },
  adminFieldValue: {
    serverTimestamp: jest.fn(() => ({ _seconds: Date.now() / 1000 })),
    increment: jest.fn(),
  },
}));

jest.mock('@/services/projectService', () => ({
  createProjectService: jest.fn(),
}));

jest.mock('@/services/userService', () => ({
  createUserService: jest.fn(),
}));

describe('/api/award-points POST', () => {
  const createMockRequest = (body: any, token = 'valid-token') => {
    return {
      json: () => Promise.resolve(body),
      headers: new Map([['authorization', `Bearer ${token}`]]),
    } as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 without projectId or points', async () => {
    const req = createMockRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth token', async () => {
    const req = createMockRequest({ projectId: 'proj-1', points: 50 }, '');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const req = createMockRequest({ projectId: 'proj-1', points: 50 }, 'invalid');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 for non-existent project', async () => {
    const req = createMockRequest({ projectId: 'proj-1', points: 50 });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 403 when user does not own project', async () => {
    const req = createMockRequest({ projectId: 'proj-1', points: 50 });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 when project not completed', async () => {
    const req = createMockRequest({ projectId: 'proj-1', points: 50 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when points already awarded', async () => {
    const req = createMockRequest({ projectId: 'proj-1', points: 50 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('awards points successfully', async () => {
    const req = createMockRequest({ projectId: 'proj-1', points: 50 });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.pointsAwarded).toBe(50);
  });
});