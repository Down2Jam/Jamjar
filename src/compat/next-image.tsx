import type { CSSProperties, ImgHTMLAttributes } from "react";

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src: string;
  alt: string;
  fill?: boolean;
  objectFit?: CSSProperties["objectFit"];
  objectPosition?: CSSProperties["objectPosition"];
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
};

export default function Image({
  fill,
  objectFit,
  objectPosition,
  priority: _priority,
  quality: _quality,
  unoptimized: _unoptimized,
  style,
  ...props
}: ImageProps) {
  const fillStyle: CSSProperties | undefined = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }
    : undefined;

  return (
    <img
      {...props}
      style={{ ...fillStyle, objectFit, objectPosition, ...style }}
    />
  );
}
