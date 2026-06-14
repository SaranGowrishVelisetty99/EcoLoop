import { render, screen } from '@testing-library/react';
import { VirtualizedList } from './VirtualizedList';

interface MockListProps {
  children: React.ReactNode | ((props: { index: number; style: React.CSSProperties }) => React.ReactNode);
  itemCount: number;
}

// Mock react-window to avoid layout engine testing in JSDOM
jest.mock('react-window', () => ({
  List: ({ children, itemCount }: MockListProps) => (
    <div data-testid="mock-list">
      {Array.from({ length: itemCount }).map((_, i) => 
        typeof children === 'function' ? children({ index: i, style: {} }) : children
      )}
    </div>
  ),
}));

describe('VirtualizedList', () => {
  const items = [
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
  ];

  it('renders items correctly via the renderItem prop', () => {
    render(
      <VirtualizedList
        items={items}
        itemHeight={50}
        renderItem={(item) => <div key={item.id}>{item.title}</div>}
      />
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});