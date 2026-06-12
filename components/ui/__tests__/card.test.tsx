import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../card';

describe('Card', () => {
  it('renders card with children', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText('Content').closest('div')).toHaveClass('custom-class');
  });

  it('renders CardHeader, CardTitle, CardContent separately', () => {
    render(
      <Card>
        <CardHeader>Header content</CardHeader>
        <CardTitle>Title content</CardTitle>
        <CardContent>Body content</CardContent>
      </Card>
    );
    expect(screen.getByText('Header content')).toBeInTheDocument();
    expect(screen.getByText('Title content')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });
});