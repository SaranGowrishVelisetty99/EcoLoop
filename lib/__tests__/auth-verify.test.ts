import { verifyIdToken, getUidFromAuthHeader } from '../auth-verify';

jest.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: jest.fn(),
}));

const { getAdminAuth } = require('@/lib/firebase-admin');

describe('auth-verify', () => {
  let mockAuth: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = {
      verifyIdToken: jest.fn(),
    };
    getAdminAuth.mockReturnValue(mockAuth);
  });

  describe('verifyIdToken', () => {
    it('returns decoded token when valid', async () => {
      const decodedToken = { uid: 'user-1', email: 'test@test.com' };
      mockAuth.verifyIdToken.mockResolvedValue(decodedToken);

      const result = await verifyIdToken('valid-token');

      expect(result).toEqual(decodedToken);
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
    });

    it('throws error when auth not initialized', async () => {
      getAdminAuth.mockReturnValue(null);

      await expect(verifyIdToken('token')).rejects.toThrow('Firebase Admin Auth not initialized');
    });

    it('throws error when token verification fails', async () => {
      const error = new Error('Invalid token');
      mockAuth.verifyIdToken.mockRejectedValue(error);

      await expect(verifyIdToken('invalid-token')).rejects.toThrow('Invalid token');
    });
  });

  describe('getUidFromAuthHeader', () => {
    it('returns uid from valid Bearer token', async () => {
      const decodedToken = { uid: 'user-1' };
      mockAuth.verifyIdToken.mockResolvedValue(decodedToken);

      const result = await getUidFromAuthHeader('Bearer valid-token');

      expect(result).toBe('user-1');
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
    });

    it('throws error when auth header is missing', async () => {
      await expect(getUidFromAuthHeader(null)).rejects.toThrow('Missing authorization header');
    });

    it('throws error when auth header is empty string', async () => {
      await expect(getUidFromAuthHeader('')).rejects.toThrow('Missing authorization header');
    });

    it('strips Bearer prefix case-insensitively', async () => {
      const decodedToken = { uid: 'user-1' };
      mockAuth.verifyIdToken.mockResolvedValue(decodedToken);

      await getUidFromAuthHeader('bearer valid-token');
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');

      await getUidFromAuthHeader('BEARER valid-token');
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
    });

    it('throws error when token verification fails', async () => {
      const error = new Error('Invalid token');
      mockAuth.verifyIdToken.mockRejectedValue(error);

      await expect(getUidFromAuthHeader('Bearer invalid-token')).rejects.toThrow('Invalid token');
    });
  });
});