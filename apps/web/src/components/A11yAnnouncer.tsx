import React from 'react';

export interface A11yAnnouncerProps {
  message?: string;
}

/**
 * Região viva acessível (aria-live="polite") invisível visualmente (.sr-only)
 * destinada a anunciar mudanças de estado dinâmicas para leitores de tela
 * (TalkBack, VoiceOver, NVDA).
 */
export const A11yAnnouncer: React.FC<A11yAnnouncerProps> = ({ message = '' }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-testid="a11y-announcer"
    >
      {message}
    </div>
  );
};
