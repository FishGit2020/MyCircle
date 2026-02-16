import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import BottomNav from './BottomNav';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { BOTTOM_NAV_ORDER: 'bottom-nav-order' },
  WindowEvents: { BOTTOM_NAV_ORDER_CHANGED: 'bottom-nav-order-changed' },
}));

let getItemSpy: ReturnType<typeof vi.spyOn>;
let setItemSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
});

afterEach(() => {
  getItemSpy.mockRestore();
  setItemSpy.mockRestore();
});

function renderNav(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav hasActivePlayer={false} />
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('renders 4 nav items + More button by default', () => {
    renderNav();
    expect(screen.getByText('bottomNav.home')).toBeInTheDocument();
    expect(screen.getByText('bottomNav.weather')).toBeInTheDocument();
    expect(screen.getByText('bottomNav.stocks')).toBeInTheDocument();
    expect(screen.getByText('bottomNav.podcasts')).toBeInTheDocument();
    expect(screen.getByText('bottomNav.more')).toBeInTheDocument();
  });

  it('shows More popup with remaining items when More is clicked', () => {
    renderNav();
    fireEvent.click(screen.getByText('bottomNav.more'));
    expect(screen.getByText('nav.bible')).toBeInTheDocument();
    expect(screen.getByText('nav.worship')).toBeInTheDocument();
    expect(screen.getByText('nav.notebook')).toBeInTheDocument();
    expect(screen.getByText('nav.baby')).toBeInTheDocument();
    expect(screen.getByText('nav.ai')).toBeInTheDocument();
  });

  it('highlights active nav item', () => {
    renderNav('/weather');
    const weatherLink = screen.getByText('bottomNav.weather').closest('a');
    expect(weatherLink).toHaveAttribute('aria-current', 'page');
  });

  it('loads persisted order from localStorage', () => {
    const customOrder = ['/ai', '/weather', '/stocks', '/podcasts', '/', '/bible', '/worship', '/notebook', '/baby', '/child-dev'];
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'bottom-nav-order') return JSON.stringify(customOrder);
      return null;
    });
    renderNav();
    // AI should now be in the main bar
    expect(screen.getByText('nav.ai')).toBeInTheDocument();
    // Home should be in More menu
    fireEvent.click(screen.getByText('bottomNav.more'));
    expect(screen.getByText('bottomNav.home')).toBeInTheDocument();
  });

  it('opens edit mode from More popup gear button', () => {
    renderNav();
    fireEvent.click(screen.getByText('bottomNav.more'));
    fireEvent.click(screen.getByText('bottomNav.editOrder'));
    expect(screen.getByTestId('nav-editor')).toBeInTheDocument();
    expect(screen.getByText('bottomNav.editTitle')).toBeInTheDocument();
  });

  it('shows all 9 items in edit mode', () => {
    renderNav();
    fireEvent.click(screen.getByText('bottomNav.more'));
    fireEvent.click(screen.getByText('bottomNav.editOrder'));
    expect(screen.getByTestId('nav-editor-item-/')).toBeInTheDocument();
    expect(screen.getByTestId('nav-editor-item-/weather')).toBeInTheDocument();
    expect(screen.getByTestId('nav-editor-item-/ai')).toBeInTheDocument();
  });

  it('move down changes item order and saves to localStorage', () => {
    renderNav();
    fireEvent.click(screen.getByText('bottomNav.more'));
    fireEvent.click(screen.getByText('bottomNav.editOrder'));
    // Click move down on first item (Home)
    const moveDownButtons = screen.getAllByLabelText('bottomNav.moveDown');
    fireEvent.click(moveDownButtons[0]);
    expect(setItemSpy).toHaveBeenCalledWith(
      'bottom-nav-order',
      expect.stringContaining('/weather')
    );
  });

  it('reset restores default order', () => {
    renderNav();
    fireEvent.click(screen.getByText('bottomNav.more'));
    fireEvent.click(screen.getByText('bottomNav.editOrder'));
    fireEvent.click(screen.getByText('bottomNav.reset'));
    const defaultOrder = ['/', '/weather', '/stocks', '/podcasts', '/bible', '/worship', '/notebook', '/baby', '/child-dev', '/ai'];
    expect(setItemSpy).toHaveBeenCalledWith('bottom-nav-order', JSON.stringify(defaultOrder));
  });

  it('Done button closes editor', () => {
    renderNav();
    fireEvent.click(screen.getByText('bottomNav.more'));
    fireEvent.click(screen.getByText('bottomNav.editOrder'));
    expect(screen.getByTestId('nav-editor')).toBeInTheDocument();
    fireEvent.click(screen.getByText('bottomNav.editDone'));
    expect(screen.queryByTestId('nav-editor')).not.toBeInTheDocument();
  });

  it('dispatches window event on save', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    renderNav();
    fireEvent.click(screen.getByText('bottomNav.more'));
    fireEvent.click(screen.getByText('bottomNav.editOrder'));
    fireEvent.click(screen.getByText('bottomNav.reset'));
    const navEvent = dispatchSpy.mock.calls.find(
      (call) => (call[0] as Event).type === 'bottom-nav-order-changed'
    );
    expect(navEvent).toBeDefined();
    dispatchSpy.mockRestore();
  });
});
