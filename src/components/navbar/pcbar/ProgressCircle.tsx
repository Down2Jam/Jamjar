import { useTranslations } from "next-intl";
import { useId, useEffect, useState } from "react";

type RoundedProgressRingProps = {
  percent: number;
  width?: number;
  height?: number;
  stroke?: number;
  hovered?: boolean;
  baseGradient?: [string, string];
  hoverGradient?: [string, string];
};

export default function ProgressCircle({
  percent,
  width = 60,
  height = 24,
  stroke = 1.5,
  hovered = false,
  baseGradient,
  hoverGradient,
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
    if (percent <= 2) return ["#e06680", "#e06666"];
    if (percent <= 6) return ["#e06666", "#e08766"];
    if (percent <= 12) return ["#e08766", "#e0a366"];
    if (percent <= 25) return ["#e0a366", "#e0c866"];
    if (percent <= 55) return ["#e0c866", "#d2e066"];
    if (percent <= 75) return ["#d2e066", "#ade066"];
    if (percent <= 87) return ["#ade066", "#7ee066"];
    return ["#7ee066", "#7ee066"]; // final green
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
      className="shrink-0 transition-transform duration-300 group-hover:rotate-[5deg] transform"
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
          <stop
            offset="0%"
            stopColor={hovered ? hoverGradient[0] : startColor}
          />
          <stop
            offset="100%"
            stopColor={hovered ? hoverGradient[1] : endColor}
          />
        </linearGradient>
      </defs>

      {/* Background ring */}
      <path d={pathData} fill="none" stroke="#0a0a0a" strokeWidth={stroke} />

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
        className="duration-300 group-hover:rotate-[70deg] transform group-hover:opacity-0 transition-all"
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
        className="transition-all duration-300 group-hover:rotate-[0deg] opacity-0 group-hover:opacity-100 rotate-[70deg] transform"
      >
        {t("Language.Select")}
      </text>
    </svg>
  );
}
