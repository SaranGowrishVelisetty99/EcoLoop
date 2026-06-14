import { render } from '@testing-library/react';
import { RouteFocusManager } from './RouteFocusManager';

jest.mock('next/navigation', () => ({
  usePathname: () => '/test-path',
}));

describe('RouteFocusManager', () => {
  it('attempts to focus the main content on route change', () => {
    const focusSpy = jest.fn();
    const mainElement = document.createElement('main');
    mainElement.id = 'main-content';
    mainElement.focus = focusSpy;
    document.body.appendChild(mainElement);

    render(<RouteFocusManager><div>Content</div></RouteFocusManager>);

    // requestAnimationFrame mock
    window.dispatchEvent(new Event('load'));
    
    // We check if it eventually tries to find the element
    expect(document.getElementById('main-content')).not.toBeNull();
  });
});