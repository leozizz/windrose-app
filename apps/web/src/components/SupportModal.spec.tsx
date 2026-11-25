import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SupportModal, buildLivePixUrl } from './SupportModal';

describe('buildLivePixUrl', () => {
  it('deve construir URL com fallback leozizz quando username não for informado', () => {
    expect(buildLivePixUrl(10)).toBe('https://livepix.gg/leozizz?amount=10');
  });

  it('deve incluir mensagem codificada após trim quando preenchida', () => {
    const url = buildLivePixUrl(25, '  Ótimo roteiro para minha viagem!  ');
    expect(url).toBe(
      'https://livepix.gg/leozizz?amount=25&message=%C3%93timo%20roteiro%20para%20minha%20viagem!'
    );
  });

  it('deve ignorar mensagem composta apenas por espaços', () => {
    expect(buildLivePixUrl(50, '   ')).toBe('https://livepix.gg/leozizz?amount=50');
  });

  it('deve usar username customizado quando fornecido', () => {
    expect(buildLivePixUrl(100, 'Valeu!', 'viajante')).toBe(
      'https://livepix.gg/viajante?amount=100&message=Valeu!'
    );
  });
});

describe('SupportModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    onClose.mockReset();
  });

  it('não deve renderizar nada quando isOpen for false', () => {
    render(<SupportModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByTestId('support-modal')).toBeNull();
  });

  it('deve renderizar diálogo acessível com copy contextualizada ao Windrose sem mencionar Studyzz', () => {
    render(<SupportModal isOpen={true} onClose={onClose} />);

    const dialog = screen.getByTestId('support-modal');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('support-modal-title');

    const title = document.getElementById('support-modal-title');
    expect(title?.textContent).toContain('Windrose');

    const whyCard = screen.getByTestId('support-why-card');
    expect(whyCard).toBeDefined();

    const fullText = dialog.textContent?.toLowerCase() ?? '';
    expect(fullText).not.toContain('studyzz');
    expect(fullText).not.toContain('estudos');
  });

  it('deve renderizar os 5 presets com R$ 10 ativo por padrão e atualizar o input ao selecionar outro preset', () => {
    render(<SupportModal isOpen={true} onClose={onClose} />);

    const presets = [5, 10, 25, 50, 100];
    presets.forEach((value) => {
      const btn = screen.getByTestId(`support-pix-preset-${value}`);
      expect(btn.textContent).toContain(`R$ ${value}`);
      expect(btn.getAttribute('aria-pressed')).toBe(value === 10 ? 'true' : 'false');
    });

    const amountInput = screen.getByTestId('support-pix-amount-input') as HTMLInputElement;
    expect(amountInput.value).toBe('10');

    fireEvent.click(screen.getByTestId('support-pix-preset-25'));
    expect(screen.getByTestId('support-pix-preset-25').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('support-pix-preset-10').getAttribute('aria-pressed')).toBe('false');
    expect(amountInput.value).toBe('25');
  });

  it('deve bloquear teclas inválidas e sanitizar caracteres não numéricos no campo de valor', () => {
    render(<SupportModal isOpen={true} onClose={onClose} />);

    const amountInput = screen.getByTestId('support-pix-amount-input') as HTMLInputElement;
    const blockedKeys = ['.', ',', '-', '+', 'e', 'E'];

    blockedKeys.forEach((key) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      amountInput.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    fireEvent.change(amountInput, { target: { value: '12abc3' } });
    expect(amountInput.value).toBe('123');
  });

  it('deve exibir alerta acessível ao submeter valor 0 ou vazio sem abrir nova aba', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<SupportModal isOpen={true} onClose={onClose} />);

    const amountInput = screen.getByTestId('support-pix-amount-input');
    const submitBtn = screen.getByTestId('support-pix-submit-button');

    fireEvent.change(amountInput, { target: { value: '' } });
    fireEvent.click(submitBtn);

    const alert = screen.getByTestId('support-pix-error');
    expect(alert.getAttribute('role')).toBe('alert');
    expect(openSpy).not.toHaveBeenCalled();

    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.click(submitBtn);
    expect(screen.getByTestId('support-pix-error')).toBeDefined();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('deve abrir a URL LivePix em nova aba com noopener,noreferrer no submit válido', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<SupportModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('support-pix-preset-25'));
    fireEvent.change(screen.getByTestId('support-pix-message-input'), {
      target: { value: 'Ótimo roteiro para minha viagem!' },
    });
    fireEvent.click(screen.getByTestId('support-pix-submit-button'));

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      'https://livepix.gg/leozizz?amount=25&message=%C3%93timo%20roteiro%20para%20minha%20viagem!',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('deve fechar o modal com tecla Escape, clique no backdrop e clique no botão fechar', () => {
    render(<SupportModal isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('support-modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByTestId('support-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
