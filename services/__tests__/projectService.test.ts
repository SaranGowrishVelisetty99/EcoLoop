import { createProjectService, ProjectService, ProjectInput } from '../projectService';

interface MockDoc {
  get: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

interface MockCollection {
  add: jest.Mock;
  doc: jest.Mock;
  where: jest.Mock;
}

interface MockDb {
  collection: jest.Mock;
}

interface MockFieldValue {
  serverTimestamp: jest.Mock;
}

describe('ProjectService', () => {
  let mockDb: MockDb;
  let mockFieldValue: MockFieldValue;
  let service: ProjectService;
  let mockCollection: MockCollection;
  let mockDoc: MockDoc;

  beforeEach(() => {
    mockDoc = {
      get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockCollection = {
      add: jest.fn(() => Promise.resolve({ id: 'proj-123' })),
      doc: jest.fn(() => mockDoc),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] })),
      })),
    };

    mockDb = {
      collection: jest.fn(() => mockCollection),
    };

    mockFieldValue = {
      serverTimestamp: jest.fn(() => ({ _seconds: Date.now() / 1000 })),
    };

    service = createProjectService(mockDb, mockFieldValue);
  });

  describe('createProject', () => {
    it('creates a new project and returns projectId', async () => {
      const input: ProjectInput = {
        userId: 'user-1',
        scanId: 'scan-1',
        suggestionId: 'suggestion-1',
      };

      const result = await service.createProject(input);

      expect(result).toBe('proj-123');
      expect(mockDb.collection).toHaveBeenCalledWith('userProjects');
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          scanId: 'scan-1',
          suggestionId: 'suggestion-1',
          status: 'saved',
          startedAt: expect.any(Object),
          completedAt: null,
          updatedAt: expect.any(Object),
          pointsAwarded: false,
        })
      );
    });

    it('uses provided status when given', async () => {
      const input: ProjectInput = {
        userId: 'user-1',
        scanId: 'scan-1',
        suggestionId: 'suggestion-1',
        status: 'in_progress',
      };

      await service.createProject(input);

      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
        })
      );
    });

    it('includes serverTimestamp for timestamps', async () => {
      const input: ProjectInput = {
        userId: 'user-1',
        scanId: 'scan-1',
        suggestionId: 'suggestion-1',
      };

      await service.createProject(input);

      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          startedAt: expect.any(Object),
          updatedAt: expect.any(Object),
        })
      );
    });
  });

  describe('updateProject', () => {
    it('updates project with serverTimestamp', async () => {
      await service.updateProject('proj-1', { status: 'completed' });

      expect(mockCollection.doc).toHaveBeenCalledWith('proj-1');
      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          updatedAt: expect.any(Object),
        })
      );
    });

    it('updates multiple fields', async () => {
      await service.updateProject('proj-1', {
        status: 'in_progress',
        startedAt: { seconds: 123456 },
        pointsAwarded: true,
      });

      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
          startedAt: { seconds: 123456 },
          pointsAwarded: true,
          updatedAt: expect.any(Object),
        })
      );
    });
  });

  describe('getProject', () => {
    it('returns project when exists', async () => {
      const mockProject = { userId: 'user-1', scanId: 'scan-1', status: 'saved' };
      mockDoc.get.mockResolvedValue({
        exists: true,
        id: 'proj-1',
        data: () => mockProject,
      });

      const result = await service.getProject('proj-1');

      expect(result).toEqual({ id: 'proj-1', ...mockProject });
      expect(mockCollection.doc).toHaveBeenCalledWith('proj-1');
    });

    it('returns null when not exists', async () => {
      mockDoc.get.mockResolvedValue({
        exists: false,
      });

      const result = await service.getProject('proj-1');

      expect(result).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('deletes project', async () => {
      await service.deleteProject('proj-1');

      expect(mockCollection.doc).toHaveBeenCalledWith('proj-1');
      expect(mockDoc.delete).toHaveBeenCalled();
    });
  });

  describe('getProjectsByScan', () => {
    it('returns projects for scanId', async () => {
      const mockProjects = [
        { id: 'proj-1', scanId: 'scan-1', status: 'saved' },
        { id: 'proj-2', scanId: 'scan-1', status: 'completed' },
      ];
      const mockSnapshot = {
        docs: mockProjects.map((p) => ({ id: p.id, data: () => p })),
      };
      mockCollection.where.mockReturnValue({
        get: jest.fn(() => Promise.resolve(mockSnapshot)),
      });

      const result = await service.getProjectsByScan('scan-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('proj-1');
      expect(result[1].id).toBe('proj-2');
      expect(mockCollection.where).toHaveBeenCalledWith('scanId', '==', 'scan-1');
    });
  });

  describe('getProjectsByUser', () => {
    it('returns projects for userId', async () => {
      const mockProjects = [
        { id: 'proj-1', userId: 'user-1', status: 'saved' },
        { id: 'proj-2', userId: 'user-1', status: 'completed' },
      ];
      const mockSnapshot = {
        docs: mockProjects.map((p) => ({ id: p.id, data: () => p })),
      };
      mockCollection.where.mockReturnValue({
        get: jest.fn(() => Promise.resolve(mockSnapshot)),
      });

      const result = await service.getProjectsByUser('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-1');
      expect(result[1].userId).toBe('user-1');
      expect(mockCollection.where).toHaveBeenCalledWith('userId', '==', 'user-1');
    });
  });
});