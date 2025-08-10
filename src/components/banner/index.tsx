"use client";

import { useTheme } from "@/providers/SiteThemeProvider";
import { RefObject } from "react";

export default function Banner({
  ref = null,
  className = null,
  width = 556,
}: {
  ref?: RefObject<SVGSVGElement> | null;
  className?: string | null;
  width?: number;
}) {
  const { siteTheme } = useTheme();
  const height = (width * 186) / 556;

  return (
    <svg
      ref={ref}
      className={className || undefined}
      viewBox="0 0 556 186"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={siteTheme.colors.blueDarkDark} />
          <stop offset="100%" stopColor={siteTheme.colors.blueDarkDarkDark} />
        </linearGradient>
        <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={siteTheme.colors.pink} />
          <stop offset="100%" stopColor={siteTheme.colors.purpleDark} />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect fill="url(#bgGrad)" width="556" height="186" rx="14.22" />

      {/* Dark polygons (was .cls-2) */}
      <g fill={siteTheme.colors.blueDarkDarkDark}>
        <polygon points="140.47 0 102.29 0 0 102.29 0 140.47 140.47 0" />
        <polygon points="293.21 0 255.03 0 69.03 186 107.21 186 293.21 0" />
        <polygon points="64.11 0 25.92 0 0 25.92 0 64.11 64.11 0" />
        <polygon points="369.58 0 331.39 0 145.39 186 183.58 186 369.58 0" />
        <path
          d="M345.66,166,168.19,343.47a14.22,14.22,0,0,0,13,8.53h16.62l186-186Z"
          transform="translate(-167 -166)"
        />
        <polygon points="522.31 0 484.13 0 298.13 186 336.31 186 522.31 0" />
        <path
          d="M723,208.68V180.22a14.17,14.17,0,0,0-2.18-7.54L541.5,352h38.18Z"
          transform="translate(-167 -166)"
        />
        <polygon points="445.94 0 407.76 0 221.76 186 259.94 186 445.94 0" />
        <polygon points="556 119.05 556 80.86 450.86 186 489.05 186 556 119.05" />
        <path
          d="M723,337.78V323.23L694.23,352h14.55A14.22,14.22,0,0,0,723,337.78Z"
          transform="translate(-167 -166)"
        />
      </g>

      {/* Accent shapes (was .cls-3) */}
      <g fill="url(#accGrad)">
        <path
          d="M704.91,166H692.22a197.8,197.8,0,0,1,2,27.69c0,63.44-30.15,120.22-77.64,158.31H635.3c44-39.94,71.45-96.1,71.45-158.31A209.29,209.29,0,0,0,704.91,166Z"
          transform="translate(-167 -166)"
        />
        <path
          d="M675.34,352h16.53A218.18,218.18,0,0,0,723,304.77V270.63A204.35,204.35,0,0,1,675.34,352Z"
          transform="translate(-167 -166)"
        />
        <path
          d="M213.1,166H195.21A223,223,0,0,0,167,200v23.93A209.84,209.84,0,0,1,213.1,166Z"
          transform="translate(-167 -166)"
        />
        <path
          d="M168,337.5c0,1.92,0,3.82.09,5.73a14.19,14.19,0,0,0,13,8.76c-.35-4.79-.54-9.62-.54-14.49,0-71.25,38-134.1,95.93-171.5H255.4C202.13,206.22,168,268.09,168,337.5Z"
          transform="translate(-167 -166)"
        />
      </g>
    </svg>
  );
}
