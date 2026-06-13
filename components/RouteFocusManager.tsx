'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useFocusRestore } from '@/hooks/useFocusTrap';

export function RouteFocusManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { saveFocus, restoreFocus } = useFocusRestore();

  useEffect(() => {
    saveFocus();
    requestAnimationFrame(() => {
      restoreFocus();
      const mainContent = document.getElementById('main-content');
      mainContent?.focus();
    });
  }, [pathname, saveFocus, restoreFocus]);

  return <>{children}</>;
}