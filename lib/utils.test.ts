import { cn } from './utils';

describe('cn utility', () => {
  it('should combine class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('should handle conditional classes and tailwind merging', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
    // Checks if tailwind-merge logic works (last one wins for the same property)
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});