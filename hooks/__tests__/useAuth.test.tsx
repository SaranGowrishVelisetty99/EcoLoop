import { renderHook, act } from '@testing-library/react';
import { useAuth, AuthProvider } from '../useAuth';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  auth: {},
}));

const { onAuthStateChanged } = require('firebase/auth');

function Wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

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

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    
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

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    
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
