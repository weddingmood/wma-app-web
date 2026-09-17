import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: "light" | "dark";
}

export function Logo({ size = 48, className = "", showText = true, variant = "dark" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Wedding Mood Circular Emblem with Pure White Backdrop, African Geometric Border & Gold Monogram */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Outer Emerald Gradient */}
          <radialGradient id="wmEmeraldGrad" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#0E3528" />
            <stop offset="100%" stopColor="#082018" />
          </radialGradient>

          {/* Luxury Gold Foil Gradient */}
          <linearGradient id="wmGoldLuxe" x1="120" y1="100" x2="380" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F9E2AF" />
            <stop offset="25%" stopColor="#D8A854" />
            <stop offset="50%" stopColor="#B37D28" />
            <stop offset="75%" stopColor="#E9CA7E" />
            <stop offset="100%" stopColor="#9C6B1C" />
          </linearGradient>

          {/* Inner Black Core */}
          <radialGradient id="wmCoreBlack" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#181818" />
            <stop offset="85%" stopColor="#0A0A0A" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
        </defs>

        {/* 0. Fond blanc pur du logo */}
        <circle cx="250" cy="250" r="248" fill="#FFFFFF" />

        {/* 1. Anneau Vert Émeraude Extérieur */}
        <circle cx="250" cy="250" r="240" fill="url(#wmEmeraldGrad)" stroke="#B37D28" strokeWidth="4" />

        {/* 2. Anneau Concentrique Ivoire et Bordure Dorée */}
        <circle cx="250" cy="250" r="222" fill="#FAF6EE" stroke="#C05638" strokeWidth="2.5" />
        <circle cx="250" cy="250" r="186" fill="#0A0A0A" stroke="#B37D28" strokeWidth="3" />

        {/* 3. Motifs Géométriques Traditionnels Africains sur l'Anneau Ivoire */}
        <g stroke="#B37D28" strokeWidth="2" fill="none" opacity="0.95">
          {/* Haut */}
          <path d="M250 34 L260 52 L240 52 Z" fill="#B37D28" />
          <path d="M250 56 L262 70 L238 70 Z" fill="none" stroke="#B37D28" strokeWidth="2" />

          {/* Bas */}
          <path d="M250 466 L260 448 L240 448 Z" fill="#B37D28" />
          <path d="M250 444 L262 430 L238 430 Z" fill="none" stroke="#B37D28" strokeWidth="2" />

          {/* Gauche */}
          <path d="M34 250 L52 260 L52 240 Z" fill="#B37D28" />
          <path d="M56 250 L70 262 L70 238 Z" fill="none" stroke="#B37D28" strokeWidth="2" />

          {/* Droite */}
          <path d="M466 250 L448 260 L448 240 Z" fill="#B37D28" />
          <path d="M444 250 L430 262 L430 238 Z" fill="none" stroke="#B37D28" strokeWidth="2" />

          {/* Losanges Diagonaux */}
          <rect x="96" y="96" width="16" height="16" transform="rotate(45 104 104)" fill="#B37D28" />
          <rect x="380" y="96" width="16" height="16" transform="rotate(45 388 104)" fill="#B37D28" />
          <rect x="96" y="380" width="16" height="16" transform="rotate(45 104 388)" fill="#B37D28" />
          <rect x="380" y="380" width="16" height="16" transform="rotate(45 388 388)" fill="#B37D28" />

          {/* Chevrons décoratifs */}
          <path d="M165 48 L175 62 L185 48" strokeWidth="2.5" />
          <path d="M315 48 L325 62 L335 48" strokeWidth="2.5" />
          <path d="M165 452 L175 438 L185 452" strokeWidth="2.5" />
          <path d="M315 452 L325 438 L335 452" strokeWidth="2.5" />
          <path d="M48 165 L62 175 L48 185" strokeWidth="2.5" />
          <path d="M48 315 L62 325 L48 335" strokeWidth="2.5" />
          <path d="M452 165 L438 175 L452 185" strokeWidth="2.5" />
          <path d="M452 315 L438 325 L452 335" strokeWidth="2.5" />
        </g>

        {/* 4. Disque Central Noir Velours */}
        <circle cx="250" cy="250" r="183" fill="url(#wmCoreBlack)" />

        {/* 5. Entrelacs Doré */}
        <path
          d="M268 185 C235 155 195 190 205 235 C212 268 250 280 270 305 C295 338 270 375 230 370 C195 365 185 330 200 300 C215 270 260 230 285 200"
          stroke="url(#wmGoldLuxe)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* 6. Lettre 'W' en Or */}
        <path
          d="M135 178 L152 178 L195 315 L232 185 L248 185 L210 325 L190 325 L145 185 L135 185 Z"
          fill="url(#wmGoldLuxe)"
        />
        <path
          d="M192 185 L204 185 L245 315 L288 178 L304 178 L260 325 L240 325 L200 195 Z"
          fill="url(#wmGoldLuxe)"
        />

        {/* 7. Lettre 'M' en Or */}
        <path
          d="M285 178 L310 178 L355 285 L398 178 L422 178 L422 325 L404 325 L404 212 L364 318 L346 318 L305 212 L305 325 L285 325 Z"
          fill="url(#wmGoldLuxe)"
        />

        {/* 8. Mention 'WEDDING MOOD' */}
        <text
          x="250"
          y="370"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fontSize="22"
          fontWeight="700"
          letterSpacing="8"
          textAnchor="middle"
          fill="#52796F"
          opacity="0.9"
        >
          WEDDING MOOD
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-serif text-xl font-bold tracking-wider leading-tight ${
              variant === "light" ? "text-white" : "text-stone-900"
            }`}
          >
            WEDDING MOOD
          </span>
          <span className="text-[10px] tracking-widest uppercase text-[#C05638] font-bold">
            Côte d’Ivoire
          </span>
        </div>
      )}
    </div>
  );
}
