import { Star } from "lucide-react";

export default function RatingStars({ value, color, size = 16, className = "" }: {
  value: number;
  color: string;
  size?: number;
  className?: string;
}) {
  const score = Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0;

  return (
    <span className={`flex shrink-0 gap-0.5 ${className}`} style={{ color }} aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="relative block" style={{ width: size, height: size }}>
          <Star size={size} fill="currentColor" stroke="none" className="opacity-20" />
          <span
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${Math.min(1, Math.max(0, score - index)) * 100}%` }}
          >
            <Star size={size} fill="currentColor" stroke="none" className="max-w-none" />
          </span>
        </span>
      ))}
    </span>
  );
}
