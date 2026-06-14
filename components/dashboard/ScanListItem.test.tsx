import { render, screen, fireEvent } from '@testing-library/react';
import { ScanListItem } from './ScanListItem';

describe('ScanListItem', () => {
  const mockScan = {
    id: 'scan-1',
    detectedObject: 'Plastic Bottle',
    materialType: 'Plastic',
    imageUrl: 'https://test.com/img.jpg',
    confidenceScore: 0.95,
  };
  const mockDelete = jest.fn();

  it('renders scan details and handles deletion', () => {
    render(<ScanListItem scan={mockScan} onDelete={mockDelete} />);
    
    expect(screen.getByText('Plastic Bottle')).toBeInTheDocument();
    expect(screen.getAllByText(/Plastic/i)).toHaveLength(2);
    
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    fireEvent.click(deleteBtn);
    expect(mockDelete).toHaveBeenCalledWith('scan-1');
  });
});