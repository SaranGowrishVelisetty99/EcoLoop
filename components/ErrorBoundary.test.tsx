import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test Error');
};

describe('ErrorBoundary', () => {
  it('catches errors and displays fallback UI', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary fallback={<div data-testid="error-fallback">Something went wrong</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary fallback={<div>Error</div>}><div>Safe Content</div></ErrorBoundary>
    );
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });
});