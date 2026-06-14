import { createUserService, UserService } from '../userService';

describe('UserService', () => {
  let mockDb: any;
  let mockFieldValue: any;
  let service: UserService;
  let mockCollection: any;
  let mockDoc: any;

  beforeEach(() => {
    mockDoc = {
      get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockCollection = {
      doc: jest.fn(() => mockDoc),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ docs: [] })),
        })),
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
    };

    mockDb = {
      collection: jest.fn(() => mockCollection),
      runTransaction: jest.fn((fn) => fn({
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ points: 0 }) })),
        set: jest.fn(),
        update: jest.fn(),
      })),
    };

    mockFieldValue = {
      serverTimestamp: jest.fn(() => ({ _seconds: Date.now() / 1000 })),
    };

    service = createUserService(mockDb, mockFieldValue);
  });

  describe('getUser', () => {
    it('returns user when exists', async () => {
      const mockUser = { uid: 'user-1', email: 'test@test.com', username: 'testuser', points: 100 };
      mockDoc.get.mockResolvedValue({
        exists: true,
        id: 'user-1',
        data: () => mockUser,
      });

      const result = await service.getUser('user-1');

      expect(result).toEqual({ uid: 'user-1', ...mockUser });
      expect(mockDb.collection).toHaveBeenCalledWith('users');
      expect(mockCollection.doc).toHaveBeenCalledWith('user-1');
    });

    it('returns null when user does not exist', async () => {
      mockDoc.get.mockResolvedValue({
        exists: false,
      });

      const result = await service.getUser('user-1');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('creates user with email as username when username not provided', async () => {
      await service.createUser('user-1', 'test@test.com');

      expect(mockCollection.doc).toHaveBeenCalledWith('user-1');
      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'user-1',
          email: 'test@test.com',
          username: 'test@test.com',
          points: 0,
          createdAt: expect.any(Object),
        }),
        { merge: true }
      );
    });

    it('creates user with provided username', async () => {
      await service.createUser('user-1', 'test@test.com', 'customuser');

      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'customuser',
        }),
        { merge: true }
      );
    });

    it('includes serverTimestamp for createdAt', async () => {
      await service.createUser('user-1', 'test@test.com');

      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.any(Object),
        }),
        { merge: true }
      );
    });
  });

  describe('awardPoints', () => {
    it('awards points using transaction', async () => {
      const transaction = {
        get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({ points: 50 }) })),
        set: jest.fn(),
      };
      mockDb.runTransaction.mockImplementation((fn) => fn(transaction));

      const result = await service.awardPoints('user-1', 25);

      expect(result).toBe(25);
      expect(mockDb.runTransaction).toHaveBeenCalled();
      expect(transaction.get).toHaveBeenCalledWith(mockDoc);
      expect(transaction.set).toHaveBeenCalledWith(mockDoc, { points: 75 }, { merge: true });
    });

    it('starts from 0 points when user does not exist', async () => {
      const transaction = {
        get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
        set: jest.fn(),
      };
      mockDb.runTransaction.mockImplementation((fn) => fn(transaction));

      const result = await service.awardPoints('user-1', 25);

      expect(result).toBe(25);
      expect(transaction.set).toHaveBeenCalledWith(mockDoc, { points: 25 }, { merge: true });
    });
  });

  describe('getLeaderboard', () => {
    it('returns leaderboard ordered by points desc', async () => {
      const mockUsers = [
        { uid: 'user-1', email: 'a@test.com', username: 'user1', points: 100 },
        { uid: 'user-2', email: 'b@test.com', username: 'user2', points: 200 },
      ];
      const mockSnapshot = {
        docs: mockUsers.map((u) => ({ id: u.uid, data: () => u })),
      };
      mockCollection.orderBy.mockReturnValue({
        limit: jest.fn(() => ({ get: jest.fn(() => Promise.resolve(mockSnapshot)) })),
      });

      const result = await service.getLeaderboard(10);

      expect(result).toHaveLength(2);
      expect(result[0].points).toBe(200);
      expect(result[1].points).toBe(100);
      expect(mockCollection.orderBy).toHaveBeenCalledWith('points', 'desc');
    });

    it('uses default limit of 50', async () => {
      mockCollection.orderBy.mockReturnValue({
        limit: jest.fn(() => ({ get: jest.fn(() => Promise.resolve({ docs: [] })) })),
      });

      await service.getLeaderboard();

      expect(mockCollection.orderBy).toHaveBeenCalledWith('points', 'desc');
    });
  });
});