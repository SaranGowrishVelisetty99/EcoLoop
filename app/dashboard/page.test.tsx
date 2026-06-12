import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import DashboardPage from './page';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth: any, callback: any) => {
    callback({ uid: 'test-user', email: 'test@example.com' });
    return () => {};
  },
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn((ref, callback) => {
    callback({ docs: [] });
    return () => {};
  }),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}));

describe('DashboardPage accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<DashboardPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have skip link', () => {
    render(<DashboardPage />);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
  });

  it('should have main landmark with id', () => {
    render(<DashboardPage />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('should have proper heading hierarchy', () => {
    render(<DashboardPage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it('should have navigation with aria-label', () => {
    render(<DashboardPage />);
    const nav = screen.getByRole('navigation', { name: /dashboard navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it('should have Carbon Footprint button in nav', () => {
    render(<DashboardPage />);
    const carbonBtn = screen.getByRole('button', { name: /carbon footprint/i });
    expect(carbonBtn).toBeInTheDocument();
  });
});