import { render, act, screen } from '@testing-library/react';
import { useInfiniteScroll } from './useInfiniteScroll';

function TestComponent({ hasMore, loading, loadMore }: {
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
}) {
  const { sentinelRef, isIntersecting } = useInfiniteScroll({ hasMore, loading, loadMore });
  
  return (
    <div>
      <div data-testid="is-intersecting">{isIntersecting.toString()}</div>
      <div ref={sentinelRef} data-testid="sentinel" />
    </div>
  );
}

interface IntersectionObserverCallback {
  (entries: IntersectionObserverEntry[]): void;
}

interface MockIntersectionObserverInstance {
  observe: jest.Mock;
  disconnect: jest.Mock;
  callback: IntersectionObserverCallback;
}

describe('useInfiniteScroll', () => {
  let observeMock: jest.Mock;
  let disconnectMock: jest.Mock;
  let intersectCallback: IntersectionObserverCallback;
  let mockObserverInstance: MockIntersectionObserverInstance;

  beforeEach(() => {
    observeMock = jest.fn();
    disconnectMock = jest.fn();
    intersectCallback = () => {};
    mockObserverInstance = {
      observe: observeMock,
      disconnect: disconnectMock,
      callback: intersectCallback,
    };
    
    (global as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver = jest.fn().mockImplementation((callback: IntersectionObserverCallback) => {
      intersectCallback = callback;
      return mockObserverInstance;
    });
  });

  it('should call loadMore when intersecting and hasMore is true', () => {
    const loadMore = jest.fn();
    render(<TestComponent hasMore={true} loading={false} loadMore={loadMore} />);

    act(() => {
      intersectCallback([{ isIntersecting: true }]);
    });

    expect(loadMore).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('is-intersecting').textContent).toBe('true');
  });

  it('should NOT call loadMore when loading is true', () => {
    const loadMore = jest.fn();
    render(<TestComponent hasMore={true} loading={true} loadMore={loadMore} />);

    act(() => {
      intersectCallback([{ isIntersecting: true }]);
    });
    expect(loadMore).not.toHaveBeenCalled();
  });

  it('should disconnect observer on unmount', () => {
    const { unmount } = render(<TestComponent hasMore={true} loading={false} loadMore={jest.fn()} />);
    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});