import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('PWA Manifest & HTML Meta Tags Audit', () => {
  it('deve conter um manifest.webmanifest válido e completo', () => {
    const manifestPath = path.resolve(__dirname, '../public/manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);

    expect(manifest.name).toContain('Windrose');
    expect(manifest.short_name).toBe('Windrose');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#ea580c');
    expect(manifest.background_color).toBe('#fbfbf9');
    expect(manifest.lang).toBe('pt-BR');

    const icons = manifest.icons as Array<{ src: string; sizes: string; purpose?: string }>;
    expect(icons.length).toBeGreaterThanOrEqual(2);
    expect(icons.some((i) => i.sizes === '192x192' && i.purpose?.includes('maskable'))).toBe(true);
    expect(icons.some((i) => i.sizes === '512x512' && i.purpose?.includes('maskable'))).toBe(true);
  });

  it('deve conter metatags PWA e link para manifest no index.html', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    const html = fs.readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(html).toContain('name="theme-color" content="#ea580c"');
    expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('viewport-fit=cover');
  });

  it('deve conter arquivo sw.js estático no diretório public', () => {
    const swPath = path.resolve(__dirname, '../public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain("addEventListener('install'");
    expect(swContent).toContain("addEventListener('activate'");
    expect(swContent).toContain("addEventListener('fetch'");
    expect(swContent).toContain('caches.open');
  });
});
