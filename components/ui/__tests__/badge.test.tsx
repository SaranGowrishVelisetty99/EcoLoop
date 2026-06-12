import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Badge text</Badge>);
    expect(screen.getByText('Badge text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Badge</Badge>);
    expect(screen.getByText('Badge')).toHaveClass('custom-badge');
  });

  it('applies base styles', () => {
    render(<Badge>Styled</Badge>);
    const badge = screen.getByText('Styled');
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('border');
    expect(badge).toHaveClass('text-xs');
  });
});