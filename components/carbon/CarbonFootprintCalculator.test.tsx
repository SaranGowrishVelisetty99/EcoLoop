import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('./TransportSection', () => ({ TransportSection: () => <div data-testid="transport" /> }));
jest.mock('./EnergySection', () => ({ EnergySection: () => <div data-testid="energy" /> }));
jest.mock('./DietSection', () => ({ DietSection: () => <div data-testid="diet" /> }));
jest.mock('./ConsumptionSection', () => ({ ConsumptionSection: () => <div data-testid="consumption" /> }));

interface CardProps {
  children: React.ReactNode;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  [key: string]: unknown;
}

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: CardProps) => <div>{children}</div>,
  CardContent: ({ children }: CardProps) => <div>{children}</div>,
  CardHeader: ({ children }: CardProps) => <div>{children}</div>,
  CardTitle: ({ children }: CardProps) => <div>{children}</div>,
}));
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: ButtonProps) => <button onClick={onClick} {...props}>{children}</button>,
}));
jest.mock('@/lib/carbonCalculations', () => ({
  calculateCarbonFootprint: jest.fn(),
  getDefaultInput: jest.fn(() => ({
    transport: {},
    energy: {},
    diet: {},
    consumption: {},
  })),
}));

describe('CarbonFootprintCalculator', () => {
  const initialResult = {
    totalKgCo2PerYear: 5000,
    breakdown: { transport: 2000, energy: 1000, diet: 1000, consumption: 1000 },
    percentiles: { transport: 50, energy: 50, diet: 50, consumption: 50 },
    averageTotalKgCo2PerYear: 9000,
    lastCalculated: new Date()
  };

  it('updates state and displays current calculation', async () => {
    const { CarbonFootprintCalculator } = await import('./CarbonFootprintCalculator');
    const onSave = jest.fn();
    render(<CarbonFootprintCalculator initialResult={initialResult} onSave={onSave} />);
    
    // Check if initial value is rendered
    expect(screen.getByText(/5000/)).toBeInTheDocument();
    
    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalled();
  });
});