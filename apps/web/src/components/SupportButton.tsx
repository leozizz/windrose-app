import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { SupportModal } from './SupportModal';

export interface SupportButtonProps {
  enablePix?: boolean;
  hasActiveCity?: boolean;
}

/**
 * Botão discreto de apoio voluntário via Pix (LivePix) com abertura do modal.
 */
export const SupportButton: React.FC<SupportButtonProps> = ({
  enablePix = true,
  hasActiveCity = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (!enablePix) {
    return null;
  }

  const buttonClassName = hasActiveCity
    ? 'support-floating-btn support-floating-btn--above-nav'
    : 'support-floating-btn';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        data-testid="support-floating-button"
        aria-label="Apoiar o projeto Windrose com Pix"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={buttonClassName}
      >
        <span className="support-floating-icon" aria-hidden="true">
          <Coffee size={18} strokeWidth={2.2} />
        </span>
        <span className="support-floating-label">Apoiar com Pix</span>
      </button>

      <SupportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        enablePix={enablePix}
      />
    </>
  );
};
