/**
 * Registra o Service Worker do Windrose App para suporte PWA e cache offline
 * de recursos essenciais (HTML, CSS do design system, fontes e bundles).
 */
export const registerServiceWorker = (): void => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && Boolean(navigator.serviceWorker)) {
    window.addEventListener('load', () => {
      if ('serviceWorker' in navigator && Boolean(navigator.serviceWorker)) {
        navigator.serviceWorker
          .register('/sw.js')
          .catch(() => {
            // Tratamento silencioso/gracioso em produção sem bloquear a aplicação
          });
      }
    });
  }
};
