import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectListItem } from './ProjectListItem';

describe('ProjectListItem', () => {
  const mockProject = {
    id: 'proj-1',
    suggestionTitle: 'Bird Feeder',
    status: 'in_progress' as const,
  };
  const mockDelete = jest.fn();

  it('renders project info and handles deletion', () => {
    render(<ProjectListItem project={mockProject} status="in_progress" onDelete={mockDelete} />);
    
    expect(screen.getByText('Bird Feeder')).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    
    window.confirm = jest.fn(() => true);
    
    fireEvent.click(deleteBtn);
    expect(mockDelete).toHaveBeenCalledWith('proj-1');
  });
});