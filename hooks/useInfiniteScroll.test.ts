import { renderHook, act } from '@testing-library/react';
import { useInfiniteScroll } from './useInfiniteScroll';

describe('useInfiniteScroll', () => {
  let observeMock: jest.Mock;
  let disconnectMock: jest.Mock;
  let intersectCallback: (entries: any[]) => void;

  beforeEach(() => {
    observeMock = jest.fn();
    disconnectMock = jest.fn();
    intersectCallback = () => {};
    
    // Mock IntersectionObserver
    (global as any).IntersectionObserver = jest.fn().mockImplementation((callback) => {
      intersectCallback = callback;
      return {
        observe: observeMock,
        disconnect: disconnectMock,
      };
    });
  });

  it('should call loadMore when intersecting and hasMore is true', () => {
    const loadMore = jest.fn();
    const { result } = renderHook(() => useInfiniteScroll({
      hasMore: true,
      loading: false,
      loadMore,
    }));

    // Trigger intersection directly on the mock
    act(() => {
      const mockInstance = (global as any).IntersectionObserver.mock.results[0].value;
      mockInstance.callback([{ isIntersecting: true }]);
    });

    expect(loadMore).toHaveBeenCalledTimes(1);
    expect(result.current.isIntersecting).toBe(true);
  });

  it('should NOT call loadMore when loading is true', () => {
    const loadMore = jest.fn();
    renderHook(() => useInfiniteScroll({
      hasMore: true,
      loading: true,
      loadMore,
    }));

    act(() => {
      const mockInstance = (global as any).IntersectionObserver.mock.results[0].value;
      mockInstance.callback([{ isIntersecting: true }]);
    });
    expect(loadMore).not.toHaveBeenCalled();
  });

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useInfiniteScroll({ hasMore: true, loading: false, loadMore: jest.fn() }));
    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});