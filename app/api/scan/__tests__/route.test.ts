import { POST } from '../route';
import { createScanService } from '@/services/scanService';
import { createUserService } from '@/services/userService';
import { getUidFromAuthHeader } from '@/lib/auth-verify';

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve({ id: 'scan-123' })),
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        update: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
    })),
    batch: jest.fn(() => ({
      delete: jest.fn(),
      commit: jest.fn(),
    })),
    runTransaction: jest.fn((fn) => fn({
      get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ points: 0 }) })),
      set: jest.fn(),
      update: jest.fn(),
    })),
  },
  adminFieldValue: {
    serverTimestamp: jest.fn(() => ({ _seconds: Date.now() / 1000 })),
    increment: jest.fn(),
  },
}));

jest.mock('@/services/scanService', () => ({
  createScanService: jest.fn(),
}));

jest.mock('@/services/userService', () => ({
  createUserService: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: jest.fn(),
    increment: jest.fn(),
  },
}));

jest.mock('@/lib/auth-verify', () => ({
  getUidFromAuthHeader: jest.fn(),
  verifyIdToken: jest.fn(),
}));

describe('/api/scan POST', () => {
  const createMockRequest = (body: any, token = 'valid-token') => {
    return {
      json: () => Promise.resolve(body),
      headers: new Map([['authorization', `Bearer ${token}`]]),
    } as any;
  };

  let mockScanService: any;
  let mockUserService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NVIDIA_NIM_API_KEY = 'test-key';

    (getUidFromAuthHeader as jest.Mock).mockResolvedValue('user-1');

    mockScanService = {
      createScan: jest.fn(() => Promise.resolve({
        scanId: 'scan-123',
        result: { id: 'scan-123', detectedObject: 'Bottle', suggestions: [] },
      })),
    };

    mockUserService = {
      getUser: jest.fn(() => Promise.resolve({ uid: 'user-1', points: 0 })),
      awardPoints: jest.fn(() => Promise.resolve(25)),
    };

    (createScanService as jest.Mock).mockReturnValue(mockScanService);
    (createUserService as jest.Mock).mockReturnValue(mockUserService);
  });

  it('returns 401 without auth token', async () => {
    const req = createMockRequest({ imageDataUrl: 'data:image/png;base64,test' }, '');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const req = createMockRequest({ imageDataUrl: 'data:image/png;base64,test' }, 'invalid');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 without image input', async () => {
    const req = createMockRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates scan and awards points', async () => {
    const req = createMockRequest({
      imageDataUrl: 'data:image/png;base64,test',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.scanId).toBeDefined();
    expect(mockScanService.createScan).toHaveBeenCalled();
    expect(mockUserService.awardPoints).toHaveBeenCalledWith('user-1', 25);
  });

  it('uses mock data when NVIDIA key missing', async () => {
    delete process.env.NVIDIA_NIM_API_KEY;
    const req = createMockRequest({ imageDataUrl: 'data:image/png;base64,test' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.result.detectedObject).toBe('Wooden crate');
  });
});