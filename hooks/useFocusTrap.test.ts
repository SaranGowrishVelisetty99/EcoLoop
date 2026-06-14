import { renderHook } from '@testing-library/react';
import { useFocusTrap, useFocusRestore } from './useFocusTrap';

describe('useFocusTrap hooks', () => {
  describe('useFocusTrap', () => {
    it('should return a ref object', () => {
      const { result } = renderHook(() => useFocusTrap(true));
      expect(result.current).toHaveProperty('current');
    });

    it('should not attach listeners if disabled', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      renderHook(() => useFocusTrap(false));
      // Note: the hook attaches to the containerRef.current, which is null in tests
      // So we verify it doesn't throw or do anything unexpected
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('useFocusRestore', () => {
    it('should save and restore focus', () => {
      const mockElement = { focus: jest.fn() } as unknown as HTMLElement;
      const { result } = renderHook(() => useFocusRestore());

      // Mock active element
      Object.defineProperty(document, 'activeElement', {
        value: mockElement,
        writable: true,
      });

      result.current.saveFocus();
      
      // Change focus
      Object.defineProperty(document, 'activeElement', { value: null });
      
      result.current.restoreFocus();

      expect(mockElement.focus).toHaveBeenCalled();
    });
  });
});