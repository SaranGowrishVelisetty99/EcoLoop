import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import CarbonPage from './page';

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

jest.mock('@/components/carbon/CarbonFootprintCalculator', () => ({
  CarbonFootprintCalculator: () => <div data-testid="calculator" role="region" aria-label="Carbon Footprint Calculator" />,
}));

jest.mock('@/components/carbon/CarbonFootprintCharts', () => ({
  CarbonFootprintCharts: () => <div data-testid="charts" role="region" aria-label="Carbon Footprint Charts" />,
}));

jest.mock('@/components/carbon/CarbonFootprintGoals', () => ({
  CarbonFootprintGoals: () => <div data-testid="goals" role="region" aria-label="Carbon Footprint Goals" />,
}));

describe('CarbonFootprintPage accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<CarbonPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have skip link', () => {
    render(<CarbonPage />);
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
  });

  it('should have main landmark with id', () => {
    render(<CarbonPage />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('should have back to dashboard button', () => {
    render(<CarbonPage />);
    const backBtn = screen.getByRole('button', { name: /back to dashboard/i });
    expect(backBtn).toBeInTheDocument();
  });

  it('should have proper heading hierarchy', () => {
    render(<CarbonPage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });
});