'use client';

import { RouteFocusManager } from '@/components/RouteFocusManager';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <RouteFocusManager>
      {children}
    </RouteFocusManager>
  );
}