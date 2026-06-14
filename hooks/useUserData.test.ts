import { renderHook, waitFor } from '@testing-library/react';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('useUserData hooks', () => {
  const mockUserId = 'user-123';

  let mockOnSnapshot: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    mockOnSnapshot = jest.fn();
    jest.doMock('firebase/firestore', () => ({
      collection: jest.fn(),
      query: jest.fn(),
      where: jest.fn(),
      onSnapshot: mockOnSnapshot,
      doc: jest.fn(),
    }));
  });

  const importHooks = async () => {
    const hooks = await import('./useUserData');
    return {
      useUserScans: hooks.useUserScans,
      useUserProjects: hooks.useUserProjects,
      useUserPoints: hooks.useUserPoints,
    };
  };

  describe('useUserScans', () => {
    beforeEach(() => {
      mockOnSnapshot = jest.fn();
      jest.doMock('firebase/firestore', () => ({
        collection: jest.fn(),
        query: jest.fn(),
        where: jest.fn(),
        onSnapshot: mockOnSnapshot,
        doc: jest.fn(),
      }));
    });

    it('should return empty scans and not loading if no userId', async () => {
      const { useUserScans } = await importHooks();
      const { result } = renderHook(() => useUserScans(null));
      expect(result.current.scans).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should fetch scans for a given userId', async () => {
      const { useUserScans } = await importHooks();
      const mockScans = [{ id: 'scan-1', detectedObject: 'Bottle' }];
      mockOnSnapshot.mockImplementation((q, callback) => {
        callback({
          docs: mockScans.map(s => ({ id: s.id, data: () => s }))
        });
        return () => {};
      });

      const { result } = renderHook(() => useUserScans(mockUserId));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.scans).toHaveLength(1);
      expect(result.current.scans[0].detectedObject).toBe('Bottle');
    });
  });

  describe('useUserProjects', () => {
    beforeEach(() => {
      mockOnSnapshot = jest.fn();
      jest.doMock('firebase/firestore', () => ({
        collection: jest.fn(),
        query: jest.fn(),
        where: jest.fn(),
        onSnapshot: mockOnSnapshot,
        doc: jest.fn(),
      }));
    });

    it('should fetch projects for a given userId', async () => {
      const { useUserProjects } = await importHooks();
      const mockProjects = [{ id: 'proj-1', status: 'saved' }];
      mockOnSnapshot.mockImplementation((q, callback) => {
        callback({
          docs: mockProjects.map(p => ({ id: p.id, data: () => p }))
        });
        return () => {};
      });

      const { result } = renderHook(() => useUserProjects(mockUserId));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.projects).toHaveLength(1);
    });
  });

  describe('useUserPoints', () => {
    beforeEach(() => {
      mockOnSnapshot = jest.fn();
      jest.doMock('firebase/firestore', () => ({
        collection: jest.fn(),
        query: jest.fn(),
        where: jest.fn(),
        onSnapshot: mockOnSnapshot,
        doc: jest.fn(),
      }));
    });

    it('should fetch points from user document', async () => {
      const { useUserPoints } = await importHooks();
      mockOnSnapshot.mockImplementation((ref, callback) => {
        callback({
          exists: () => true,
          data: () => ({ points: 500 })
        });
        return () => {};
      });

      const { result } = renderHook(() => useUserPoints(mockUserId));
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.points).toBe(500);
      });
    });
  });
});