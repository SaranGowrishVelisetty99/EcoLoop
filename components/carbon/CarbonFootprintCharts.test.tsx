import { render, screen } from '@testing-library/react';
import { CarbonFootprintCharts } from './CarbonFootprintCharts';

// Mock Recharts to avoid JSDOM layout issues
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
}));

describe('CarbonFootprintCharts', () => {
  const mockResult = {
    totalKgCo2PerYear: 5000,
    breakdown: { transport: 2000, energy: 1000, diet: 1000, consumption: 1000 },
    percentiles: { transport: 50, energy: 50, diet: 50, consumption: 50 },
    averageTotalKgCo2PerYear: 9000,
    lastCalculated: new Date()
  };

  it('renders charts when result is provided', () => {
    render(<CarbonFootprintCharts result={mockResult} />);
    
    expect(screen.getAllByText(/Footprint Breakdown/i)).toHaveLength(2);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('returns null when no result is provided', () => {
    const { container } = render(<CarbonFootprintCharts result={null} />);
    expect(container.firstChild).toBeNull();
  });
});