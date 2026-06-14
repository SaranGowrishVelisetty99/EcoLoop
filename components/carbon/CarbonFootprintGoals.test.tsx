import { render, screen, waitFor } from '@testing-library/react';

const mockAuth = { currentUser: null };

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => mockAuth),
}));

jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  firebaseApp: {},
  db: {},
  storage: {},
}));

// Mock lucide-react icons individually
jest.mock('lucide-react', () => ({
  Target: () => <span data-testid="target-icon" />,
  Flag: () => <span data-testid="flag-icon" />,
  X: () => <span data-testid="x-icon" />,
  CheckCircle: () => <span data-testid="check-circle-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
}));

import * as auth from 'firebase/auth';

describe('CarbonFootprintGoals', () => {
  const mockUserId = 'user-123';
  const mockUser = { uid: mockUserId, getIdToken: () => Promise.resolve('mock-token') };
  
  beforeEach(() => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((a, callback) => {
      callback(mockUser);
      return () => {};
    });
    
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ goals: [] }),
      })
    );
  });

  it('renders empty state when no goals exist', async () => {
    const { CarbonFootprintGoals } = await import('./CarbonFootprintGoals');
    render(<CarbonFootprintGoals userId={mockUserId} currentFootprint={null} />);
    
    await waitFor(() => {
      expect(screen.getByText(/No reduction goals yet/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders existing goals from API', async () => {
    const { CarbonFootprintGoals } = await import('./CarbonFootprintGoals');
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ goals: [{ id: '1', targetReductionPercentage: 20, targetDate: new Date().toISOString(), baselineTotalKgCo2: 5000 }] }),
      })
    );

    render(<CarbonFootprintGoals userId={mockUserId} currentFootprint={null} />);
    await waitFor(() => {
      expect(screen.getByText(/20% reduction target/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});