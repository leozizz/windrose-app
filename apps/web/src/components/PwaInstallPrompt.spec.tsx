import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PwaInstallPrompt } from './PwaInstallPrompt';

interface MockBeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const createBeforeInstallPromptEvent = (
  outcome: 'accepted' | 'dismissed' = 'accepted'
): MockBeforeInstallPromptEvent => {
  const event = new Event('beforeinstallprompt', {
    bubbles: true,
    cancelable: true,
  }) as MockBeforeInstallPromptEvent;

  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: 'web' });

  return event;
};

describe('PwaInstallPrompt Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('deve permanecer oculto enquanto o evento beforeinstallprompt não for disparado', () => {
    render(<PwaInstallPrompt />);

    expect(screen.queryByTestId('pwa-install-banner')).toBeNull();
    expect(screen.queryByTestId('pwa-install-button')).toBeNull();
  });

  it('deve exibir o banner de instalação ao capturar o evento beforeinstallprompt', () => {
    render(<PwaInstallPrompt />);

    const installEvent = createBeforeInstallPromptEvent();

    act(() => {
      window.dispatchEvent(installEvent);
    });

    const banner = screen.getByTestId('pwa-install-banner');
    expect(banner).toBeDefined();
    expect(screen.getByText(/instalar windrose/i)).toBeDefined();
    expect(screen.getByTestId('pwa-install-button')).toBeDefined();
    expect(screen.getByTestId('pwa-dismiss-button')).toBeDefined();
  });

  it('deve chamar event.prompt() e ocultar o banner ao clicar no botão de instalar', async () => {
    render(<PwaInstallPrompt />);

    const installEvent = createBeforeInstallPromptEvent('accepted');

    act(() => {
      window.dispatchEvent(installEvent);
    });

    const installBtn = screen.getByTestId('pwa-install-button');

    await act(async () => {
      fireEvent.click(installBtn);
    });

    expect(installEvent.prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('pwa-install-banner')).toBeNull();
  });

  it('deve ocultar o banner e salvar preferência em sessionStorage ao descartar', () => {
    render(<PwaInstallPrompt />);

    const installEvent = createBeforeInstallPromptEvent();

    act(() => {
      window.dispatchEvent(installEvent);
    });

    const dismissBtn = screen.getByTestId('pwa-dismiss-button');
    fireEvent.click(dismissBtn);

    expect(screen.queryByTestId('pwa-install-banner')).toBeNull();
    expect(sessionStorage.getItem('windrose_pwa_dismissed')).toBe('true');
  });

  it('não deve exibir o banner se a flag de dispensa já estiver em sessionStorage', () => {
    sessionStorage.setItem('windrose_pwa_dismissed', 'true');

    render(<PwaInstallPrompt />);

    const installEvent = createBeforeInstallPromptEvent();

    act(() => {
      window.dispatchEvent(installEvent);
    });

    expect(screen.queryByTestId('pwa-install-banner')).toBeNull();
  });
});
