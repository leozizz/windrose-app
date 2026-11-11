import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STORAGE_KEY = 'windrose_pwa_dismissed';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const isDismissed = window.sessionStorage.getItem(STORAGE_KEY);
      if (isDismissed === 'true') {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent default mini-infobar on mobile browsers
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
        setDeferredPrompt(null);
      } else {
        setIsVisible(false);
      }
    } catch {
      setIsVisible(false);
    }
  }, [deferredPrompt]);

  const handleDismissClick = useCallback(() => {
    setIsVisible(false);
    setDeferredPrompt(null);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_KEY, 'true');
    }
  }, []);

  if (!isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <aside
      className="pwa-install-banner"
      role="complementary"
      aria-label="Instalação do Aplicativo"
      data-testid="pwa-install-banner"
    >
      <div className="pwa-install-content">
        <div className="pwa-install-badge">
          <Sparkles size={16} />
        </div>
        <div className="pwa-install-texts">
          <strong className="pwa-install-title">Instalar Windrose</strong>
          <p className="pwa-install-desc">
            Acesse seus roteiros e clima offline diretamente da sua tela inicial.
          </p>
        </div>
      </div>

      <div className="pwa-install-actions">
        <button
          type="button"
          className="pwa-install-btn-action"
          onClick={handleInstallClick}
          data-testid="pwa-install-button"
          aria-label="Instalar aplicativo agora"
        >
          <Download size={15} />
          <span>Instalar</span>
        </button>

        <button
          type="button"
          className="pwa-install-btn-dismiss"
          onClick={handleDismissClick}
          data-testid="pwa-dismiss-button"
          aria-label="Dispensar aviso de instalação"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
};
