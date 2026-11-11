import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerServiceWorker } from './serviceWorkerRegistration';

describe('Service Worker Registration', () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('deve registrar /sw.js com sucesso quando o navegador suporta serviceWorker', () => {
    const registerMock = vi.fn().mockResolvedValue({
      scope: '/',
      active: null,
      installing: null,
      waiting: null,
    });

    Object.defineProperty(window, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: {
          register: registerMock,
        },
      },
      writable: true,
      configurable: true,
    });

    registerServiceWorker();
    window.dispatchEvent(new Event('load'));

    expect(registerMock).toHaveBeenCalledWith('/sw.js');
  });

  it('não deve lançar exceção nem quebrar quando o navegador não suporta serviceWorker', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: undefined,
      },
      writable: true,
      configurable: true,
    });

    expect(() => {
      registerServiceWorker();
      window.dispatchEvent(new Event('load'));
    }).not.toThrow();
  });

  it('deve capturar rejeição de registro de forma graciosa sem estourar uncaught error', async () => {
    const registerMock = vi.fn().mockRejectedValue(new Error('Registration failed'));

    Object.defineProperty(window, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: {
          register: registerMock,
        },
      },
      writable: true,
      configurable: true,
    });

    registerServiceWorker();
    window.dispatchEvent(new Event('load'));

    expect(registerMock).toHaveBeenCalledWith('/sw.js');
  });
});
