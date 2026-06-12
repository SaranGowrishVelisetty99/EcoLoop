'use client';

import { ErrorBoundary } from './ErrorBoundary';

export default function GlobalErrorBoundary({
  children,
}: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Global error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}