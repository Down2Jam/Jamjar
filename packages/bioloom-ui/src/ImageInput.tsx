"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon, { IconName } from "./Icon";
import { useTheme } from "./theme";
import { Button } from "./Button";
import {
  default as Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "./Modal";
import { Vstack } from "./Stack";
import Text from "./Text";

export type ImageInputProps = {
  value?: string | null;
  onSelect: (file: File, crop?: ImageCropData) => void | Promise<void>;
  onClear?: () => void;
  accept?: string;
  disabled?: boolean;
  width?: number | string;
  height?: number | string;
  aspectRatio?: number | string;
  className?: string;
  placeholder?: string;
  icon?: IconName;
  enableCrop?: boolean;
  maxOutputSize?: number;
  maxOutputWidth?: number;
  maxOutputHeight?: number;
  showClearButton?: boolean;
};

export type ImageCropData = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const toCssSize = (value?: number | string) =>
  value === undefined
    ? undefined
    : typeof value === "number"
    ? `${value}px`
    : value;

const parseAspectRatio = (ratio?: number | string) => {
  if (!ratio) return undefined;
  if (typeof ratio === "number") return ratio;
  const cleaned = ratio.toString().trim();
  if (!cleaned) return undefined;
  if (cleaned.includes("/")) {
    const [w, h] = cleaned.split("/").map((v) => parseFloat(v.trim()));
    if (!Number.isNaN(w) && !Number.isNaN(h) && h !== 0) return w / h;
  }
  const asNumber = parseFloat(cleaned);
  return Number.isNaN(asNumber) || asNumber === 0 ? undefined : asNumber;
};

const hexToRgba = (hex: string | undefined, alpha: number) => {
  const safeHex = hex ?? "#0b1220";
  const value = safeHex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function ImageInput({
  value,
  onSelect,
  onClear,
  accept = "image/*",
  disabled = false,
  width,
  height,
  aspectRatio,
  className = "",
  placeholder = "Add image",
  icon = "plus",
  enableCrop = true,
  maxOutputSize,
  maxOutputWidth,
  maxOutputHeight,
  showClearButton = true,
}: ImageInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [saving, setSaving] = useState(false);
  const dragState = useRef<{ x: number; y: number } | null>(null);

  const resolvedAspectRatio = useMemo(() => {
    if (aspectRatio) return aspectRatio;
    if (width && height) {
      const w = typeof width === "number" ? width : parseFloat(width);
      const h = typeof height === "number" ? height : parseFloat(height);
      if (!Number.isNaN(w) && !Number.isNaN(h) && h !== 0) {
        return `${w} / ${h}`;
      }
    }
    return undefined;
  }, [aspectRatio, width, height]);

  const resolvedRatio = useMemo(() => {
    return (
      parseAspectRatio(resolvedAspectRatio) ??
      parseAspectRatio(aspectRatio) ??
      1
    );
  }, [resolvedAspectRatio, aspectRatio]);

  const maxWidth = toCssSize(width);
  const resolvedHeight = toCssSize(height);

  const previewSize = useMemo(() => {
    const maxW = 480;
    const maxH = 360;
    const ratio = resolvedRatio || 1;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return { width: w, height: h };
  }, [resolvedRatio]);

  useEffect(() => {
    if (!cropSrc) return;
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = cropSrc;
  }, [cropSrc]);

  const clampOffset = (
    nextOffset: { x: number; y: number },
    nextZoom: number,
    nextRotation = rotation
  ) => {
    const cropW = previewSize.width;
    const cropH = previewSize.height;
    if (!imageSize.width || !imageSize.height) return nextOffset;
    const baseScale = Math.max(
      cropW / imageSize.width,
      cropH / imageSize.height
    );
    const scale = baseScale * nextZoom;
    const radians = (nextRotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const scaledW = imageSize.width * scale;
    const scaledH = imageSize.height * scale;
    const boundsW = scaledW * cos + scaledH * sin;
    const boundsH = scaledW * sin + scaledH * cos;
    const maxX = Math.max(0, (boundsW - cropW) / 2);
    const maxY = Math.max(0, (boundsH - cropH) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, nextOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, nextOffset.y)),
    };
  };

  const handleFiles = async (files?: FileList | null) => {
    const file = files?.[0];
    if (!file || disabled) return;
    if (!enableCrop) {
      await onSelect(file);
      return;
    }
    const url = URL.createObjectURL(file);
    setCropFile(file);
    setCropSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setCropOpen(true);
  };

  const handleCloseCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropOpen(false);
    setCropSrc(null);
    setCropFile(null);
    setImageSize({ width: 0, height: 0 });
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
  };

  const handleConfirmCrop = async () => {
    if (!cropSrc || !cropFile) return;
    const img = new Image();
    img.src = cropSrc;
    await img.decode();

    const cropW = Math.max(1, Math.round(previewSize.width));
    const cropH = Math.max(1, Math.round(previewSize.height));
    const baseScale = Math.max(cropW / img.naturalWidth, cropH / img.naturalHeight);
    const scale = baseScale * zoom;
    const radians = (rotation * Math.PI) / 180;

    const scaledW = img.naturalWidth * scale;
    const scaledH = img.naturalHeight * scale;
    const imgLeft = (cropW - scaledW) / 2 + offset.x;
    const imgTop = (cropH - scaledH) / 2 + offset.y;
    const sourceX = Math.max(0, -imgLeft / scale);
    const sourceY = Math.max(0, -imgTop / scale);
    const sourceW = Math.min(img.naturalWidth, cropW / scale);
    const sourceH = Math.min(img.naturalHeight, cropH / scale);

    const cropData: ImageCropData = {
      left: Math.max(0, Math.round(sourceX)),
      top: Math.max(0, Math.round(sourceY)),
      width: Math.max(1, Math.round(sourceW)),
      height: Math.max(1, Math.round(sourceH)),
    };

    const isAnimatedGif =
      cropFile.type === "image/gif" &&
      rotation % 360 === 0 &&
      !flipX &&
      !flipY;

    if (isAnimatedGif) {
      setSaving(true);
      try {
        await onSelect(cropFile, cropData);
        handleCloseCrop();
      } finally {
        setSaving(false);
      }
      return;
    }

    const canvas = document.createElement("canvas");
    const resolutionScale = 1 / scale;
    let outW = Math.max(1, Math.round(cropW * resolutionScale));
    let outH = Math.max(1, Math.round(cropH * resolutionScale));
    const maxW = maxOutputWidth ?? maxOutputSize ?? Number.POSITIVE_INFINITY;
    const maxH = maxOutputHeight ?? maxOutputSize ?? Number.POSITIVE_INFINITY;
    if (
      Number.isFinite(maxW) &&
      Number.isFinite(maxH) &&
      (outW > maxW || outH > maxH)
    ) {
      const downscale = Math.min(maxW / outW, maxH / outH);
      outW = Math.max(1, Math.round(outW * downscale));
      outH = Math.max(1, Math.round(outH * downscale));
    }
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      handleCloseCrop();
      return;
    }

    const outputScale = outW / cropW;
    ctx.clearRect(0, 0, outW, outH);
    ctx.translate(outW / 2 + offset.x * outputScale, outH / 2 + offset.y * outputScale);
    ctx.rotate(radians);
    ctx.scale(
      (flipX ? -1 : 1) * scale * outputScale,
      (flipY ? -1 : 1) * scale * outputScale
    );
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, cropFile.type || "image/png", 0.85)
    );
    if (!blob) {
      handleCloseCrop();
      return;
    }

    const croppedFile = new File([blob], cropFile.name, { type: blob.type });
    setSaving(true);
    try {
      await onSelect(croppedFile);
      handleCloseCrop();
    } finally {
      setSaving(false);
    }
  };

  const cropImageStyle = (() => {
    if (!cropSrc || !imageSize.width || !imageSize.height) {
      return {
        transform: "translate(-50%, -50%)",
        userSelect: "none",
        transformOrigin: "center",
        pointerEvents: "none",
      } as const;
    }
    const cropW = previewSize.width;
    const cropH = previewSize.height;
    const baseScale = Math.max(cropW / imageSize.width, cropH / imageSize.height);
    const displayScale = baseScale * zoom;
    return {
      width: `${imageSize.width}px`,
      height: `${imageSize.height}px`,
      maxWidth: "none",
      maxHeight: "none",
      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg) scaleX(${flipX ? -displayScale : displayScale}) scaleY(${flipY ? -displayScale : displayScale})`,
      transformOrigin: "center",
      userSelect: "none",
      pointerEvents: "none",
    } as const;
  })();

  return (
    <>
      <div
        className={`relative ${className}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setDragActive(false);
        }}
        style={{
          width: "100%",
          maxWidth: maxWidth,
          aspectRatio: resolvedAspectRatio,
          height: resolvedAspectRatio ? undefined : resolvedHeight,
          minHeight: resolvedHeight,
        }}
      >
        {Boolean(value) && showClearButton && onClear && (
          <button
            type="button"
            aria-label="Remove image"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (disabled) return;
              onClear();
            }}
            disabled={disabled}
            className="absolute right-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border transition-opacity duration-150"
            style={{
              borderColor: colors["grayDark"],
              backgroundColor: hexToRgba(colors["mantle"], 0.85),
              color: colors["text"],
              opacity: hovered ? 1 : 0,
              pointerEvents: hovered ? "auto" : "none",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <Icon name="x" size={14} />
          </button>
        )}
        <button
          type="button"
          aria-label={placeholder}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (disabled) return;
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            if (disabled) return;
            setDragActive(false);
            handleFiles(event.dataTransfer.files);
          }}
          disabled={disabled}
          className="w-full h-full overflow-hidden rounded-lg border-2 border-dashed transition-all"
          style={{
            borderColor: dragActive
              ? colors["blue"]
              : hovered
              ? colors["grayLight"]
              : colors["grayDark"],
            backgroundColor:
              hovered || dragActive ? colors["base"] : colors["mantle"],
            cursor: disabled ? "not-allowed" : "pointer",
            color: colors["textFaded"],
          }}
        >
          {value ? (
            <img
              src={value}
              alt={placeholder}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <span
                className="inline-flex items-center justify-center transition-transform"
                style={{
                  transform: hovered || dragActive ? "scale(1.15)" : "scale(1)",
                }}
              >
                <Icon name={icon} />
              </span>
              <span className="text-xs opacity-70">{placeholder}</span>
            </div>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            handleFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
      </div>

      <Modal
        isOpen={cropOpen}
        onOpenChange={(next) => {
          if (next === false) handleCloseCrop();
        }}
        backdrop="opaque"
      >
        <ModalContent
          style={{
            backgroundColor: colors["mantle"],
            borderColor: colors["base"],
          }}
        >
          <ModalHeader>
            <Vstack align="start">
              <Text size="xl" color="text">
                Crop image
              </Text>
              <Text size="sm" color="textFaded">
                Drag to position and zoom to fit
              </Text>
            </Vstack>
          </ModalHeader>
          <ModalBody>
            <Vstack align="center" gap={4}>
              <div
                className="relative overflow-hidden rounded-lg border"
                style={{
                  width: previewSize.width,
                  height: previewSize.height,
                  borderColor: colors["base"],
                  backgroundColor: colors["crust"],
                  touchAction: "none",
                }}
                onPointerDown={(event) => {
                  if (!cropSrc) return;
                  dragState.current = { x: event.clientX, y: event.clientY };
                  (event.currentTarget as HTMLElement).setPointerCapture(
                    event.pointerId
                  );
                }}
                onPointerMove={(event) => {
                  if (!dragState.current || !cropSrc) return;
                  const dx = event.clientX - dragState.current.x;
                  const dy = event.clientY - dragState.current.y;
                  dragState.current = { x: event.clientX, y: event.clientY };
                  setOffset((prev) =>
                    clampOffset({ x: prev.x + dx, y: prev.y + dy }, zoom)
                  );
                }}
                onPointerUp={() => {
                  dragState.current = null;
                }}
                onPointerLeave={() => {
                  dragState.current = null;
                }}
              >
                {cropSrc && (
                  <img
                    src={cropSrc}
                    alt="Crop preview"
                    className="absolute left-1/2 top-1/2"
                    style={cropImageStyle}
                  />
                )}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: `0 0 0 2000px ${hexToRgba(
                      colors["crust"],
                      0.55
                    )}`,
                    border: `1px solid ${colors["grayLight"]}`,
                  }}
                />
              </div>
              <Vstack align="stretch" className="w-full gap-2">
                <Text size="xs" color="textFaded">
                  Zoom
                </Text>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => {
                    const nextZoom = Number(event.target.value);
                    setZoom(nextZoom);
                    setOffset((prev) => clampOffset(prev, nextZoom, rotation));
                  }}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    color={flipX ? "blue" : "default"}
                    onClick={() => setFlipX((prev) => !prev)}
                  >
                    Flip Horizontal
                  </Button>
                  <Button
                    size="sm"
                    color={flipY ? "blue" : "default"}
                    onClick={() => setFlipY((prev) => !prev)}
                  >
                    Flip Vertical
                  </Button>
                  <Button
                    size="sm"
                    color="default"
                    onClick={() => {
                      const next = ((rotation - 90) % 360 + 360) % 360;
                      setRotation(next);
                      setOffset((prev) => clampOffset(prev, zoom, next));
                    }}
                  >
                    Rotate Left
                  </Button>
                  <Button
                    size="sm"
                    color="default"
                    onClick={() => {
                      const next = (rotation + 90) % 360;
                      setRotation(next);
                      setOffset((prev) => clampOffset(prev, zoom, next));
                    }}
                  >
                    Rotate Right
                  </Button>
                </div>
              </Vstack>
            </Vstack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseCrop} disabled={saving}>
              Cancel
            </Button>
            <Button color="blue" onClick={handleConfirmCrop} disabled={saving}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
