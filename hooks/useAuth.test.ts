import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
import * as auth from 'firebase/auth';
import { createElement } from 'react';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  auth: {},
}));

describe('useAuth', () => {
  it('should throw if used outside AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });

  it('should update user state when auth state changes', () => {
    const mockUser = { uid: 'user-789', email: 'test@ecoloop.com' };
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((a, callback) => {
      callback(mockUser);
      return () => {};
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => 
      createElement(AuthProvider, null, children);
      
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });
});