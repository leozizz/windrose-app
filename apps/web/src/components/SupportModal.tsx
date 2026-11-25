import React, {
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Coffee, ExternalLink, X } from 'lucide-react';

export interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  enablePix?: boolean;
}

const PIX_PRESETS = [5, 10, 25, 50, 100] as const;
const DEFAULT_LIVEPIX_USERNAME = 'leozizz';
const BLOCKED_AMOUNT_KEYS = new Set(['.', ',', '-', '+', 'e', 'E']);

/**
 * Monta a URL dinâmica de apoio no LivePix para valores inteiros em reais.
 */
export const buildLivePixUrl = (
  amount: number,
  message?: string,
  username?: string
): string => {
  const envUsername =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIVEPIX_USERNAME
      ? String(import.meta.env.VITE_LIVEPIX_USERNAME)
      : '';
  const resolvedUsername = (username ?? envUsername).trim() || DEFAULT_LIVEPIX_USERNAME;
  const baseUrl = `https://livepix.gg/${encodeURIComponent(resolvedUsername)}?amount=${amount}`;
  const trimmedMessage = (message ?? '').trim();

  if (!trimmedMessage) {
    return baseUrl;
  }

  return `${baseUrl}&message=${encodeURIComponent(trimmedMessage)}`;
};

/**
 * Modal acessível de contribuição voluntária via LivePix para o Windrose.
 */
export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  enablePix = true,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('10');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setError('');
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSelectPreset = (amount: number): void => {
    setSelectedAmount(amount);
    setCustomAmount(String(amount));
    setError('');
  };

  const handleAmountKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (BLOCKED_AMOUNT_KEYS.has(event.key)) {
      event.preventDefault();
    }
  };

  const handleCustomAmountChange = (raw: string): void => {
    const digitsOnly = raw.replace(/\D+/g, '');
    setCustomAmount(digitsOnly);

    if (!digitsOnly) {
      setSelectedAmount(0);
    } else {
      const parsed = Number.parseInt(digitsOnly, 10);
      setSelectedAmount(Number.isFinite(parsed) ? parsed : 0);
    }
    setError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!Number.isInteger(selectedAmount) || selectedAmount < 1) {
      setError('Informe um valor inteiro mínimo de R$ 1.');
      return;
    }

    const targetUrl = buildLivePixUrl(selectedAmount, message);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="support-modal-backdrop"
      data-testid="support-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="support-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
        data-testid="support-modal"
      >
        <div className="support-modal-header">
          <div className="support-modal-heading">
            <span className="support-modal-icon" aria-hidden="true">
              <Coffee size={20} strokeWidth={2.2} />
            </span>
            <h2 id="support-modal-title" className="support-modal-title">
              Apoiar o Windrose
            </h2>
          </div>

          <button
            type="button"
            className="support-modal-close"
            data-testid="support-modal-close"
            onClick={onClose}
            aria-label="Fechar janela de apoio"
          >
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <div className="support-modal-body">
          <p className="support-modal-description">
            O Windrose está ajudando a planejar suas viagens e roteiros? Pague um café e ajude a manter o planejador e as previsões climáticas sempre no ar!
          </p>

          <div className="support-why-card" data-testid="support-why-card">
            <div className="support-why-header">
              <Coffee size={15} strokeWidth={2.2} className="support-why-icon" aria-hidden="true" />
              <span className="support-why-title">Por que apoiar?</span>
            </div>
            <ul className="support-why-list">
              <li>
                Mantém o planejador de viagens, previsões climáticas e geração de roteiros gratuitos, sem anúncios nem paywalls.
              </li>
              <li>
                Incentiva novas rotas inteligentes e ferramentas open-source feitas pela comunidade.
              </li>
            </ul>
          </div>

          {enablePix && (
            <form
              className="support-pix-section"
              data-testid="support-pix-section"
              onSubmit={handleSubmit}
              noValidate
            >
              {error && (
                <div className="support-error-alert" role="alert" data-testid="support-pix-error">
                  {error}
                </div>
              )}

              <div className="support-pix-field">
                <span className="support-pix-label">Escolha um valor</span>
                <div className="support-preset-grid">
                  {PIX_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      data-testid={`support-pix-preset-${amount}`}
                      className={`support-preset-btn ${selectedAmount === amount ? 'active' : ''}`}
                      aria-pressed={selectedAmount === amount}
                      onClick={() => handleSelectPreset(amount)}
                    >
                      R$ {amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="support-pix-field">
                <label htmlFor="support-pix-amount" className="support-pix-label">
                  Outro valor inteiro (R$)
                </label>
                <div className="support-currency-wrap">
                  <span className="support-currency-prefix" aria-hidden="true">
                    R$
                  </span>
                  <input
                    id="support-pix-amount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={customAmount}
                    onKeyDown={handleAmountKeyDown}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="10"
                    data-testid="support-pix-amount-input"
                    className="support-input support-input-currency"
                  />
                </div>
              </div>

              <div className="support-pix-field">
                <label htmlFor="support-pix-message" className="support-pix-label">
                  Mensagem de incentivo (opcional)
                </label>
                <textarea
                  id="support-pix-message"
                  rows={2}
                  maxLength={200}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Deixe uma mensagem para o mantenedor..."
                  data-testid="support-pix-message-input"
                  className="support-input support-textarea"
                />
              </div>

              <button
                type="submit"
                className="support-submit-btn"
                data-testid="support-pix-submit-button"
              >
                <span>Apoiar via LivePix</span>
                <ExternalLink size={16} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
