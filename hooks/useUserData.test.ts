import { renderHook, waitFor } from '@testing-library/react';
import { useUserScans, useUserProjects, useUserPoints } from './useUserData';
import * as firestore from 'firebase/firestore';

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

  describe('useUserScans', () => {
    it('should return empty scans and not loading if no userId', () => {
      const { result } = renderHook(() => useUserScans(null));
      expect(result.current.scans).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should fetch scans for a given userId', async () => {
      const mockScans = [{ id: 'scan-1', detectedObject: 'Bottle' }];
      (firestore.onSnapshot as jest.Mock).mockImplementation((q, ...args: any[]) => {
        const observer = args[0];
        const next = typeof observer === 'function' ? observer : observer.next;
        if (next) next({
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
    it('should fetch projects for a given userId', async () => {
      const mockProjects = [{ id: 'proj-1', status: 'saved' }];
      (firestore.onSnapshot as jest.Mock).mockImplementation((q, ...args: any[]) => {
        const observer = args[0];
        const next = typeof observer === 'function' ? observer : observer.next;
        next({
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
    it('should fetch points from user document', async () => {
      (firestore.onSnapshot as jest.Mock).mockImplementation((ref, ...args: any[]) => {
        const observer = args[0];
        const next = typeof observer === 'function' ? observer : observer.next;
        next({
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