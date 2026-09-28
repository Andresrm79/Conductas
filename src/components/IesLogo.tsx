import React from 'react';

export interface IesLogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
  className?: string;
  showSubtitle?: boolean;
  subtitle?: string;
  inverted?: boolean;
}

export const IesLogo: React.FC<IesLogoProps> = ({
  variant = 'full',
  size = 'md',
  textColor,
  className = '',
  showSubtitle = false,
  subtitle = 'Gestión de Convivencia',
  inverted = false,
}) => {
  const brandOrange = '#CC4215';
  const effectiveTextColor = textColor || (inverted ? '#FFFFFF' : brandOrange);
  const markColor = brandOrange;

  // Size mapping
  const sizeStyles = {
    xs: {
      height: 'h-6',
      iconWidth: 'w-7 h-7',
      fullWidth: 'w-24',
      fontSize: 'text-xs',
      subSize: 'text-[9px]',
    },
    sm: {
      height: 'h-8',
      iconWidth: 'w-9 h-9',
      fullWidth: 'w-32',
      fontSize: 'text-sm',
      subSize: 'text-[10px]',
    },
    md: {
      height: 'h-11',
      iconWidth: 'w-12 h-12',
      fullWidth: 'w-44',
      fontSize: 'text-base',
      subSize: 'text-xs',
    },
    lg: {
      height: 'h-16',
      iconWidth: 'w-16 h-16',
      fullWidth: 'w-56',
      fontSize: 'text-xl',
      subSize: 'text-xs',
    },
    xl: {
      height: 'h-24',
      iconWidth: 'w-24 h-24',
      fullWidth: 'w-72',
      fontSize: 'text-2xl',
      subSize: 'text-sm',
    },
  }[size];

  // SVG Mark: The exact infinity ribbon with inner transparent cutouts
  const SymbolSvg = ({ className = 'w-full h-full' }: { className?: string }) => (
    <svg
      viewBox="220 80 520 310"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Emblema IES Extremadura"
    >
      <path
        fill={markColor}
        fillRule="evenodd"
        d="M 420 240
          C 375 190 325 158 272 165
          C 238 170 236 215 240 248
          C 246 295 280 338 335 350
          C 385 360 425 320 465 272
          C 515 210 565 145 615 110
          C 645 88 680 88 702 110
          C 724 132 730 168 726 210
          C 720 270 685 330 635 358
          C 595 380 545 372 498 340
          C 475 324 460 300 465 272
          C 470 280 488 300 518 312
          C 560 328 608 322 642 288
          C 676 254 690 205 684 165
          C 680 135 660 120 630 126
          C 585 135 535 185 485 245
          C 455 282 422 318 385 332
          C 345 348 305 335 278 308
          C 255 282 255 245 264 220
          C 275 190 305 178 340 182
          C 372 186 405 208 430 238
          Z
          M 345 228
          C 334 234 328 244 334 252
          C 328 260 334 270 345 275
          C 358 280 376 270 395 258
          C 414 246 425 238 418 234
          C 410 230 395 228 376 226
          C 360 224 352 224 345 228
          Z"
      />
    </svg>
  );

  // 1. Icon only
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${sizeStyles.iconWidth} ${className}`}>
        <SymbolSvg />
      </div>
    );
  }

  // 2. Horizontal layout (Symbol + Text side by side)
  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2.5 shrink-0 ${sizeStyles.height} ${className}`}>
        <div className={`shrink-0 ${sizeStyles.iconWidth}`}>
          <SymbolSvg />
        </div>
        <div className="flex flex-col justify-center leading-tight">
          <span
            className={`font-black tracking-tight ${sizeStyles.fontSize}`}
            style={{
              color: effectiveTextColor,
              fontFamily: "'Barlow Condensed', 'DIN Alternate', 'Oswald', sans-serif",
            }}
          >
            IES Extremadura
          </span>
          {showSubtitle && (
            <span
              className={`font-medium ${sizeStyles.subSize} opacity-80`}
              style={{ color: inverted ? '#CBD5E1' : '#64748B' }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 3. Compact Badge layout
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-md border ${
          inverted
            ? 'bg-white/10 border-white/15 text-white'
            : 'bg-orange-50/80 border-orange-200/80 text-orange-950'
        } ${className}`}
      >
        <div className="w-5 h-5 shrink-0">
          <SymbolSvg />
        </div>
        <span
          className="font-bold text-xs tracking-tight uppercase"
          style={{
            color: effectiveTextColor,
            fontFamily: "'Barlow Condensed', 'DIN Alternate', 'Oswald', sans-serif",
          }}
        >
          IES Extremadura
        </span>
        {showSubtitle && (
          <span className="text-[10px] opacity-75 font-normal">
            • {subtitle}
          </span>
        )}
      </div>
    );
  }

  // 4. Default: Full Stacked Logo (Symbol on top, Text centered below)
  return (
    <div className={`flex flex-col items-center justify-center text-center shrink-0 ${className}`}>
      <div className={`flex items-center justify-center ${sizeStyles.iconWidth} mb-2`}>
        <SymbolSvg />
      </div>
      <div className="flex flex-col items-center">
        <span
          className={`font-black tracking-tight ${sizeStyles.fontSize} leading-none`}
          style={{
            color: effectiveTextColor,
            fontFamily: "'Barlow Condensed', 'DIN Alternate', 'Oswald', sans-serif",
          }}
        >
          IES Extremadura
        </span>
        {showSubtitle && (
          <span
            className={`font-semibold ${sizeStyles.subSize} mt-1 tracking-wide`}
            style={{ color: inverted ? '#E2E8F0' : '#475569' }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
