import { useTheme } from "@/providers/SiteThemeProvider";
import { useTranslations } from "next-intl";
import { useId, useEffect, useState } from "react";

type RoundedProgressRingProps = {
  percent: number;
  width?: number;
  height?: number;
  stroke?: number;
  hovered?: boolean;
  hoverPrimary?: string;
  hoverSecondary?: string;
};

export default function ProgressCircle({
  percent,
  width = 60,
  height = 24,
  stroke = 1.5,
  hovered = false,
  hoverPrimary,
  hoverSecondary,
}: RoundedProgressRingProps) {
  const radius = (height - stroke) / 2;
  const arcLength = Math.PI * radius;
  const straightLength = width - 2 * radius - stroke;
  const totalLength = 2 * arcLength + 2 * straightLength;

  const progress = Math.max(0, Math.min(100, percent));
  const dashOffset = totalLength * (1 - progress / 100);

  const [animatedOffset, setAnimatedOffset] = useState(totalLength);
  const [countedPercent, setCountedPercent] = useState(0);

  const gradientId = useId();
  const t = useTranslations("Navbar");
  const { siteTheme } = useTheme();

  useEffect(() => {
    // Animate ring fill
    const timeout = setTimeout(() => {
      setAnimatedOffset(dashOffset);
    }, 10);

    // Animate number count-up
    let start: number | null = null;
    const minDuration = 400; // fastest for very low %
    const maxDuration = 800; // slowest for high %
    const duration =
      minDuration + (maxDuration - minDuration) * (percent / 100); // scale with percent

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progressTime = timestamp - start;
      const easedProgress = Math.min(progressTime / duration, 1); // linear easing
      const current = Math.floor(easedProgress * percent);
      setCountedPercent(current);
      if (easedProgress < 1) requestAnimationFrame(animate);
      else setCountedPercent(percent); // snap to final value
    };

    requestAnimationFrame(animate);

    return () => clearTimeout(timeout);
  }, [dashOffset, percent]);

  // Choose gradient colors based on progress
  const getGradient = () => {
    if (percent <= 2) return [siteTheme.colors["red"], siteTheme.colors["red"]];
    if (percent <= 6) return [siteTheme.colors["red"], siteTheme.colors["red"]];
    if (percent <= 12)
      return [siteTheme.colors["red"], siteTheme.colors["red"]];
    if (percent <= 25)
      return [siteTheme.colors["red"], siteTheme.colors["orange"]];
    if (percent <= 55)
      return [siteTheme.colors["orange"], siteTheme.colors["yellow"]];
    if (percent <= 75)
      return [siteTheme.colors["yellow"], siteTheme.colors["lime"]];
    if (percent <= 87)
      return [siteTheme.colors["lime"], siteTheme.colors["green"]];
    return [siteTheme.colors["green"], siteTheme.colors["green"]]; // final green
  };

  const [startColor, endColor] = getGradient();

  const pathData = `
    M ${stroke / 2 + radius},${stroke / 2}
    H ${width - radius - stroke / 2}
    A ${radius},${radius} 0 0 1 ${width - radius - stroke / 2},${
    height - stroke / 2
  }
    H ${stroke / 2 + radius}
    A ${radius},${radius} 0 0 1 ${stroke / 2 + radius},${stroke / 2}
    Z
  `;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 transition-transform duration-300 transform"
      style={{
        transform: hovered ? "rotate(5deg)" : "rotate(0deg)",
      }}
    >
      {/* Unique gradient definition */}
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
          className="transition-all duration-300"
        >
          <stop offset="0%" stopColor={hovered ? hoverPrimary : startColor} />
          <stop offset="100%" stopColor={hovered ? hoverSecondary : endColor} />
        </linearGradient>
      </defs>

      {/* Background ring */}
      <path
        d={pathData}
        fill="none"
        stroke={siteTheme.colors["base"]}
        strokeWidth={stroke}
      />

      {/* Foreground progress ring using gradient */}
      <path
        d={pathData}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeDasharray={totalLength}
        strokeDashoffset={animatedOffset}
        strokeLinecap="round"
        className="transition-all duration-700"
        style={{ transitionProperty: "stroke-dashoffset" }}
      />

      {/* Centered animated number */}
      <text
        x="50%"
        y="50%"
        dy="0.35em"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill={`url(#${gradientId})`}
        className="transition-all duration-300 transform"
        style={{
          rotate: hovered ? "70deg" : "0deg",
          opacity: hovered ? 0 : 1,
        }}
      >
        {countedPercent}%
      </text>
      <text
        x="50%"
        y="50%"
        dy="0.35em"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill={`url(#${gradientId})`}
        className="transition-all duration-300 transform"
        style={{
          rotate: hovered ? "0deg" : "70deg",
          opacity: hovered ? 1 : 0,
        }}
      >
        {t("Language.Select")}
      </text>
    </svg>
  );
}
