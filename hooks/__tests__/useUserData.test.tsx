import { renderHook, act } from '@testing-library/react';
import { useUserScans, useUserProjects, useUserPoints } from '../useUserData';

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

const { collection, query, where, onSnapshot, doc } = require('firebase/firestore');

describe('useUserScans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when no userId', () => {
    const { result } = renderHook(() => useUserScans(null));
    expect(result.current.scans).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetches scans when userId provided', async () => {
    const mockScans = [
      { id: 'scan-1', detectedObject: 'Bottle', userId: 'user-1' },
      { id: 'scan-2', detectedObject: 'Can', userId: 'user-1' },
    ];

    (onSnapshot as jest.Mock).mockImplementation((q, callbacks) => {
      callbacks.next({
        docs: mockScans.map((s) => ({ id: s.id, data: () => s })),
      });
      return () => {};
    });

    const { result } = renderHook(() => useUserScans('user-1'));
    await act(async () => { await Promise.resolve(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.scans).toHaveLength(2);
    expect(result.current.scans[0].id).toBe('scan-1');
  });

  it('handles error', async () => {
    const mockError = new Error('Permission denied');
    (onSnapshot as jest.Mock).mockImplementation((q, callbacks) => {
      callbacks.error(mockError);
      return () => {};
    });

    const { result } = renderHook(() => useUserScans('user-1'));
    await act(async () => { await Promise.resolve(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useUserProjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when no userId', () => {
    const { result } = renderHook(() => useUserProjects(null));
    expect(result.current.projects).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetches projects when userId provided', async () => {
    const mockProjects = [
      { id: 'proj-1', scanId: 'scan-1', status: 'saved' },
      { id: 'proj-2', scanId: 'scan-2', status: 'completed' },
    ];

    (onSnapshot as jest.Mock).mockImplementation((q, callbacks) => {
      callbacks.next({
        docs: mockProjects.map((p) => ({ id: p.id, data: () => p })),
      });
      return () => {};
    });

    const { result } = renderHook(() => useUserProjects('user-1'));
    await act(async () => { await Promise.resolve(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects[0].status).toBe('saved');
  });
});

describe('useUserPoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 0 when no userId', () => {
    const { result } = renderHook(() => useUserPoints(null));
    expect(result.current.points).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('fetches points when userId provided', async () => {
    (onSnapshot as jest.Mock).mockImplementation((ref, callbacks) => {
      callbacks.next({
        exists: () => true,
        data: () => ({ points: 125 }),
      });
      return () => {};
    });

    const { result } = renderHook(() => useUserPoints('user-1'));
    await act(async () => { await Promise.resolve(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.points).toBe(125);
  });

  it('returns 0 when user doc does not exist', async () => {
    (onSnapshot as jest.Mock).mockImplementation((ref, callbacks) => {
      callbacks.next({
        exists: () => false,
      });
      return () => {};
    });

    const { result } = renderHook(() => useUserPoints('user-1'));
    await act(async () => { await Promise.resolve(); });

    expect(result.current.points).toBe(0);
  });
});