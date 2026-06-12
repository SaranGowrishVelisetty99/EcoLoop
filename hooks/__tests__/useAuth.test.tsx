import { renderHook, act } from '@testing-library/react';
import { useAuth, useRequireAuth } from '../useAuth';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  auth: {},
}));

const { onAuthStateChanged } = require('firebase/auth');

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading initially and user after auth state changes', async () => {
    let callback: (user: any) => void;
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, cb) => {
      callback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      callback!({ uid: 'test-uid', email: 'test@test.com' });
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual({ uid: 'test-uid', email: 'test@test.com' });
  });

  it('clears user when callback fires with null', async () => {
    let callback: (user: any) => void;
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, cb) => {
      callback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      callback!({ uid: 'test-uid', email: 'test@test.com' });
      await Promise.resolve();
    });

    expect(result.current.user).toEqual({ uid: 'test-uid', email: 'test@test.com' });

    await act(async () => {
      callback!(null);
      await Promise.resolve();
    });

    expect(result.current.user).toBeNull();
  });
});

describe('useRequireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns authenticated state correctly', async () => {
    let callback: (user: any) => void;
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, cb) => {
      callback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useRequireAuth());
    
    await act(async () => {
      callback!({ uid: 'test-uid', email: 'test@test.com' });
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ uid: 'test-uid', email: 'test@test.com' });
  });

  it('returns unauthenticated when no user', async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    const { result } = renderHook(() => useRequireAuth());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});