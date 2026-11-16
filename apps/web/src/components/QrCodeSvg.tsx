import React, { useMemo } from 'react';
import { QrCode as QrCodeIcon } from 'lucide-react';
import qrcode from 'qrcode-generator';

export interface QrCodeSvgProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  className?: string;
  ariaLabel?: string;
  dataTestId?: string;
  fallbackTestId?: string;
}

interface SvgMatrixData {
  matrixSize: number;
  pathData: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 140,
  level = 'M',
  includeMargin = true,
  className,
  ariaLabel,
  dataTestId = 'itinerary-companion-qr-svg',
  fallbackTestId = 'qr-fallback',
}) => {
  const svgData: SvgMatrixData | null = useMemo(() => {
    if (!value || value.trim().length === 0) {
      return null;
    }

    try {
      // Suporte seguro a ESM/CJS bundling
      const factory = typeof qrcode === 'function' ? qrcode : ((qrcode as unknown as { default?: typeof qrcode }).default ?? qrcode);
      // typeNumber 0 indica auto-detecção da versão necessária para acomodar o texto
      const qr = factory(0, level);
      qr.addData(value);
      qr.make();

      const count = qr.getModuleCount();
      const margin = includeMargin ? 4 : 0;
      const matrixSize = count + margin * 2;

      let pathData = '';
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.isDark(row, col)) {
            pathData += `M${col + margin},${row + margin}h1v1h-1z`;
          }
        }
      }

      return {
        matrixSize,
        pathData,
      };
    } catch {
      return null;
    }
  }, [value, level, includeMargin]);

  if (!svgData) {
    return (
      <div className="companion-qr-fallback" data-testid={fallbackTestId}>
        <QrCodeIcon size={44} className="companion-qr-fallback-icon" />
      </div>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${svgData.matrixSize} ${svgData.matrixSize}`}
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
      data-testid={dataTestId}
      className={className}
    >
      <rect width="100%" height="100%" fill="#ffffff" />
      <path d={svgData.pathData} fill="#0f172a" shapeRendering="crispEdges" />
    </svg>
  );
};
