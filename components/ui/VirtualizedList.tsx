'use client';

import { useState, useEffect, useMemo } from 'react';
import { List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  itemKey?: (item: T, index: number) => string;
  width?: number | string;
  height?: number | string;
  itemSize?: number;
  style?: React.CSSProperties;
  onResize?: React.UIEventHandler<HTMLDivElement>;
  onRowsRendered?: (info: { startIndex: number; stopIndex: number }) => void;
  overscanCount?: number;
  rowComponent?: React.ComponentType<any>;
  rowCount?: number;
  rowHeight?: number | ((index: number) => number);
  rowProps?: Record<string, any>;
  tagName?: React.ElementType;
  defaultHeight?: number;
  defaultWidth?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  renderItem,
  overscanCount = 5,
  className = '',
  width = '100%',
  height = '400px',
  itemKey,
}: VirtualizedListProps<T>) {
  const [itemSize, setItemSize] = useState(itemHeight);
  
  const getItemKey = useMemo(() => 
    itemKey || ((item: T, index: number) => String(index)), 
    [itemKey]
  );
  
  // Measure item size if not fixed
  useEffect(() => {
    if (!items.length) return;
    // In a real app, you might use ResizeObserver to measure actual item heights
    setItemSize(itemHeight);
  }, [itemHeight]);
  
  return (
    <div className={className} style={{ width, height }}>
      <List
        // @ts-ignore - react-window types are incomplete
        height={typeof height === 'string' ? parseInt(height) : height}
        // @ts-ignore - react-window types don't include width/height but component accepts them
        width={typeof width === 'string' ? parseInt(width) : width}
        itemCount={items.length}
        itemSize={itemSize}
        itemData={items}
        overscanCount={overscanCount}
        itemKey={getItemKey}
      >
        {((props: { index: number; style: React.CSSProperties }) => {
          const { index, style } = props;
          return (
            <div style={style}>
              {renderItem(items[index], index, style)}
            </div>
          );
        }) as unknown as React.ReactNode}
      </List>
    </div>
  );
}

VirtualizedList.displayName = 'VirtualizedList';