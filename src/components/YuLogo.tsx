import React from 'react';

/**
 * YU LOGO MASTER GEOMETRY SPECIFICATION
 * Derived from the official technical drawing (image.png):
 * - Canvas normalized: 1000 x 1500 (aspect ratio 1 : 1.5)
 * - Y Asymmetry: Left arm visual length : Right arm visual length ≈ 1.75 : 1
 * - Y Stem: Drops down into the hollow cavity of U (suspends within U)
 * - U Structure: Angled top cuts, straight vertical walls, angled convergent bottom
 * - U Occlusion: Right U is in front (+1 Z), Left U is behind (0 Z)
 * - True Hollow Frame: Every structural beam has an outer and inner hollow wall
 */

export interface YuLogoProps {
  size?: number;
  className?: string;
  variant?: 'flat' | '2.5d' | '3d';
}

// Flat Vector Logo for TopBar (20-24px), Icons, Favicon
export const YuLogoFlat: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 1000 1500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      {/* LEFT U (Back layer Z=0) - Outer & Inner Hollow Polygon */}
      <path
        d="M 170 690 L 330 690 L 330 1100 L 500 1260 L 500 1380 L 170 1100 Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      {/* Left U Hollow Cutout */}
      <path
        d="M 230 750 L 270 750 L 270 1070 L 470 1250 L 430 1285 L 230 1070 Z"
        fill="#0B0B0C"
      />

      {/* Y STEM & ARMS (Interlocking Layer Z=0.5) */}
      {/* Y Left Arm (Long: 1.75 ratio) */}
      <path
        d="M 120 120 L 280 120 L 520 480 L 520 1120 L 440 1120 L 440 550 L 200 190 L 120 120 Z"
        fill="currentColor"
      />
      {/* Y Left Arm Hollow Cutout */}
      <path
        d="M 190 160 L 235 160 L 460 500 L 460 1080 L 480 1080 L 480 470 L 250 160 Z"
        fill="#0B0B0C"
      />

      {/* Y Right Arm (Short) */}
      <path
        d="M 520 480 L 760 240 L 840 240 L 560 520 L 520 520 Z"
        fill="currentColor"
      />
      {/* Y Right Arm Hollow Cutout */}
      <path
        d="M 550 480 L 760 270 L 795 270 L 575 490 Z"
        fill="#0B0B0C"
      />

      {/* RIGHT U (Front layer Z=+1, occludes Y bottom & Left U) */}
      <path
        d="M 830 690 L 670 690 L 670 1100 L 500 1260 L 500 1380 L 830 1100 Z"
        fill="currentColor"
      />
      {/* Right U Hollow Cutout */}
      <path
        d="M 770 750 L 730 750 L 730 1070 L 530 1250 L 570 1285 L 770 1070 Z"
        fill="#0B0B0C"
      />
    </svg>
  );
};

// 2.5D Vector Logo with Satin Titanium Facets for UI display
export const YuLogo25D: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 1000 1500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        <linearGradient id="yu-titanium-front" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
          <stop offset="50%" stopColor="#E2E3E8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#C4C6CE" stopOpacity="0.82" />
        </linearGradient>
        <linearGradient id="yu-titanium-side" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A8D96" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#4A4D55" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="yu-titanium-inner" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E2024" />
          <stop offset="100%" stopColor="#0E1012" />
        </linearGradient>
      </defs>

      {/* LEFT U BACK LAYER */}
      <g>
        {/* Left U Outer Shell */}
        <polygon
          points="180,690 320,690 320,1080 490,1240 490,1370 180,1090"
          fill="url(#yu-titanium-side)"
        />
        {/* Left U Front Face */}
        <polygon
          points="190,700 310,700 310,1070 470,1230 470,1350 190,1080"
          fill="url(#yu-titanium-front)"
        />
        {/* Left U Hollow Core */}
        <polygon
          points="240,750 260,750 260,1050 440,1220 420,1240 240,1050"
          fill="url(#yu-titanium-inner)"
        />
      </g>

      {/* Y STRUCTURE (Asymmetrical Left-Long 1.75:1) */}
      <g>
        {/* Y Left Arm Top & Body */}
        <polygon
          points="110,100 270,100 505,510 505,1080 445,1080 445,550 180,180"
          fill="url(#yu-titanium-side)"
        />
        <polygon
          points="120,110 260,110 495,505 495,1070 455,1070 455,545 190,175"
          fill="url(#yu-titanium-front)"
        />
        {/* Y Left Hollow Opening */}
        <polygon
          points="175,145 220,145 440,515 440,1040 465,1040 465,490 220,145"
          fill="url(#yu-titanium-inner)"
        />

        {/* Y Right Arm (Short) */}
        <polygon
          points="505,510 775,255 835,255 545,530 505,530"
          fill="url(#yu-titanium-side)"
        />
        <polygon
          points="510,505 765,260 820,260 540,520 510,520"
          fill="url(#yu-titanium-front)"
        />
        {/* Y Right Hollow Opening */}
        <polygon
          points="540,490 740,285 775,285 565,495"
          fill="url(#yu-titanium-inner)"
        />
      </g>

      {/* RIGHT U FRONT LAYER (Subtle Overlap Occlusion) */}
      <g>
        {/* Right U Outer Shell */}
        <polygon
          points="820,690 680,690 680,1080 500,1250 500,1380 820,1090"
          fill="url(#yu-titanium-side)"
        />
        {/* Right U Front Face */}
        <polygon
          points="810,700 690,700 690,1070 515,1240 515,1360 810,1080"
          fill="url(#yu-titanium-front)"
        />
        {/* Right U Hollow Core */}
        <polygon
          points="760,750 740,750 740,1050 560,1220 580,1240 760,1050"
          fill="url(#yu-titanium-inner)"
        />
      </g>
    </svg>
  );
};

// 3D Master Hollow Monogram (Exact render of technical drawing image.png)
export const YuLogo3DMaster: React.FC<{ size?: number; className?: string }> = ({ size = 120, className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size * 1.5}
        viewBox="0 0 1000 1500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 select-none filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
      >
        <defs>
          {/* Subtle Satin Titanium Bevel Gradients */}
          <linearGradient id="bevel-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#C8CCD4" />
          </linearGradient>
          <linearGradient id="bevel-mid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4D7DF" />
            <stop offset="100%" stopColor="#9AA0AA" />
          </linearGradient>
          <linearGradient id="bevel-dark" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7E8490" />
            <stop offset="100%" stopColor="#3E424A" />
          </linearGradient>
          <linearGradient id="hollow-depth" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1C1E22" />
            <stop offset="100%" stopColor="#0B0C0E" />
          </linearGradient>
        </defs>

        {/* 1. Left U Structure (Z=0, Back Layer) */}
        <g id="u-left-arm">
          {/* Outer Beveled Frame */}
          <polygon points="180,690 320,690 320,1080 500,1250 500,1380 180,1090" fill="url(#bevel-dark)" />
          <polygon points="190,700 310,700 310,1070 480,1230 480,1355 190,1080" fill="url(#bevel-light)" />
          {/* Inner Depth Cavity */}
          <polygon points="235,745 265,745 265,1045 440,1210 415,1235 235,1045" fill="url(#hollow-depth)" stroke="#2C2F36" strokeWidth="2" />
        </g>

        {/* 2. Y Hollow Monogram (Asymmetrical 1.75:1 Left Long Arm) */}
        <g id="y-monogram">
          {/* Y Left Arm Bevels & Depth */}
          <polygon points="110,100 270,100 505,510 505,1070 445,1070 445,550 180,180" fill="url(#bevel-dark)" />
          <polygon points="120,110 260,110 495,505 495,1060 455,1060 455,545 190,175" fill="url(#bevel-light)" />
          {/* Y Left Arm Hollow Inner Channel */}
          <polygon points="175,145 215,145 435,515 435,1030 465,1030 465,490 215,145" fill="url(#hollow-depth)" stroke="#2C2F36" strokeWidth="2" />

          {/* Y Right Arm (Short) */}
          <polygon points="505,510 775,255 835,255 545,530 505,530" fill="url(#bevel-dark)" />
          <polygon points="510,505 765,260 820,260 540,520 510,520" fill="url(#bevel-mid)" />
          {/* Y Right Hollow Inner Channel */}
          <polygon points="540,490 735,285 770,285 565,495" fill="url(#hollow-depth)" stroke="#2C2F36" strokeWidth="2" />
        </g>

        {/* 3. Right U Structure (Z=+1, Front Layer with Precision Occlusion) */}
        <g id="u-right-arm">
          {/* Outer Beveled Frame */}
          <polygon points="820,690 680,690 680,1080 500,1250 500,1380 820,1090" fill="url(#bevel-dark)" />
          <polygon points="810,700 690,700 690,1070 515,1240 515,1360 810,1080" fill="url(#bevel-light)" />
          {/* Inner Depth Cavity */}
          <polygon points="765,745 735,745 735,1045 560,1210 585,1235 765,1045" fill="url(#hollow-depth)" stroke="#2C2F36" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
};

export const YuLogo: React.FC<YuLogoProps> = ({ size = 20, className = '', variant = 'flat' }) => {
  if (variant === '3d') return <YuLogo3DMaster size={size} className={className} />;
  if (variant === '2.5d') return <YuLogo25D size={size} className={className} />;
  return <YuLogoFlat size={size} className={className} />;
};
