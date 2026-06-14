import { renderHook, waitFor } from '@testing-library/react';
import { useCollection, useDocument } from './useFirestore';
import * as firestore from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  doc: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  startAfter: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('useFirestore hooks', () => {
  const mockDocs = [
    { id: '1', data: () => ({ name: 'Test 1' }) },
    { id: '2', data: () => ({ name: 'Test 2' }) },
  ];

  describe('useCollection', () => {
    it('should initialize with loading state and fetch data', async () => {
      (firestore.onSnapshot as jest.Mock).mockImplementation((q, ...args: unknown[]) => {
        const observer = args[0];
        const next = typeof observer === 'function' ? observer : (observer as { next?: (snapshot: { docs: Array<{ id: string; data: () => { name: string } }> }) => void }).next;
        if (next) next({ docs: mockDocs });
        return () => {};
      });

      const { result } = renderHook(() => useCollection('test-path'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toHaveLength(2);
        expect(result.current.data[0]).toMatchObject({ id: '1', name: 'Test 1' });
      });
    });

    it('should handle errors', async () => {
      const errorMessage = 'Permission denied';
      (firestore.onSnapshot as jest.Mock).mockImplementation((q, ...args: unknown[]) => {
        const observer = args[0];
        const onError = typeof observer === 'function' 
          ? args[1] 
          : (observer as { error?: (error: Error) => void }).error;

        if (onError) onError(new Error(errorMessage));
        return () => {};
      });

      const { result } = renderHook(() => useCollection('test-path'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error?.message).toBe(errorMessage);
      });
    });
  });

  describe('useDocument', () => {
    it('should fetch a single document', async () => {
      (firestore.onSnapshot as jest.Mock).mockImplementation((ref, ...args: unknown[]) => {
        const observer = args[0];
        const next = typeof observer === 'function' ? observer : (observer as { next?: (snapshot: { exists: () => boolean; id: string; data: () => { title: string } }) => void }).next;
        if (next) next({
          exists: () => true,
          id: 'doc-1',
          data: () => ({ title: 'Eco project' }),
        });
        return () => {};
      });

      const { result } = renderHook(() => useDocument('projects', 'doc-1'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toMatchObject({ id: 'doc-1', title: 'Eco project' });
      });
    });

    it('should return null if document does not exist', async () => {
      (firestore.onSnapshot as jest.Mock).mockImplementation((ref, ...args: unknown[]) => {
        const observer = args[0];
        const next = typeof observer === 'function' ? observer : (observer as { next?: (snapshot: { exists: () => boolean }) => void }).next;
        if (next) next({ exists: () => false });
        return () => {};
      });

      const { result } = renderHook(() => useDocument('projects', 'missing-id'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBeNull();
      });
    });
  });
});