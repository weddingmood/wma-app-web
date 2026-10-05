import React from "react";

const KEEP_NAME_TEXT = true;

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: "light" | "dark";
}

export function Logo({ size = 48, className = "", showText = true, variant = "dark" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Wedding Mood"
        style={{ height: size, width: "auto", maxWidth: size * 3 }}
        className="shrink-0 object-contain transition-transform duration-300 hover:scale-105"
      />

      {KEEP_NAME_TEXT && showText && (
        <div className="flex flex-col">
          <span
            className={`font-serif text-xl font-bold tracking-wider leading-tight ${
              variant === "light" ? "text-white" : "text-stone-900"
            }`}
          >
            WEDDING MOOD
          </span>
          <span className="text-[10px] tracking-widest uppercase text-[#C05638] font-bold">
            C&ocirc;te d&apos;Ivoire
          </span>
        </div>
      )}
    </div>
  );
}