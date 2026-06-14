import { render, screen } from '@testing-library/react';
import CarbonFootprintPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: 'test-user', email: 'test@example.com' });
    return () => {};
  }),
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
  auth: {
    currentUser: { uid: 'test-user', email: 'test@example.com', getIdToken: () => Promise.resolve('mock-token') },
  },
  db: {},
}));

jest.mock('@/components/carbon/CarbonFootprintCalculator', () => ({
  CarbonFootprintCalculator: () => <div data-testid="calculator" />,
}));

jest.mock('@/components/carbon/CarbonFootprintCharts', () => ({
  CarbonFootprintCharts: () => <div data-testid="charts" />,
}));

jest.mock('@/components/carbon/CarbonFootprintGoals', () => ({
  CarbonFootprintGoals: () => <div data-testid="goals" />,
}));

describe('CarbonFootprintPage', () => {
  it('renders without crashing', () => {
    render(<CarbonFootprintPage />);
    expect(screen.getByText(/Carbon Footprint/i)).toBeInTheDocument();
  });

  it('shows sign in card when not authenticated', () => {
    render(<CarbonFootprintPage />);
    expect(screen.getByText(/Sign in to view your carbon footprint/i)).toBeInTheDocument();
  });
});