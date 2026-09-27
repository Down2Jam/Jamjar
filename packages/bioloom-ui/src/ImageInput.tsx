"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  pixelPerfectFit?: boolean;
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

const toPositiveNumber = (value?: number | string) => {
  if (value === undefined) return undefined;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

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

const replaceFileExtension = (name: string, extension: string) => {
  const cleanedExtension = extension.startsWith(".") ? extension : `.${extension}`;
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) return `${name}${cleanedExtension}`;
  return `${name.slice(0, dotIndex)}${cleanedExtension}`;
};

const isNearDefaultCrop = (
  zoom: number,
  offset: { x: number; y: number },
) =>
  Math.abs(zoom - 1) < 0.001 &&
  Math.abs(offset.x) < 0.001 &&
  Math.abs(offset.y) < 0.001;

const createTransformedSourceCanvas = (
  img: HTMLImageElement,
  rotation: number,
  flipX: boolean,
  flipY: boolean,
) => {
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const swapsDimensions = normalizedRotation === 90 || normalizedRotation === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swapsDimensions ? img.naturalHeight : img.naturalWidth;
  canvas.height = swapsDimensions ? img.naturalWidth : img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((normalizedRotation * Math.PI) / 180);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas;
};

const renderPixelPerfectFitBlob = async (
  source: HTMLCanvasElement,
  outputSize: { width: number; height: number },
) => {
  if (
    source.width <= 0 ||
    source.height <= 0 ||
    source.width > outputSize.width ||
    source.height > outputSize.height
  ) {
    return null;
  }

  const integerScale = Math.max(
    1,
    Math.floor(
      Math.min(outputSize.width / source.width, outputSize.height / source.height),
    ),
  );
  const logicalMaxWidth = Math.floor(outputSize.width / integerScale);
  const logicalMaxHeight = Math.floor(outputSize.height / integerScale);
  const sourceRatio = source.width / source.height;
  const targetRatio = outputSize.width / outputSize.height;

  let paddedWidth: number;
  let paddedHeight: number;
  if (sourceRatio >= targetRatio) {
    paddedWidth = logicalMaxWidth;
    paddedHeight = Math.ceil(paddedWidth / sourceRatio);
    if (paddedHeight > logicalMaxHeight) {
      paddedHeight = logicalMaxHeight;
      paddedWidth = Math.ceil(paddedHeight * sourceRatio);
    }
  } else {
    paddedHeight = logicalMaxHeight;
    paddedWidth = Math.ceil(paddedHeight * sourceRatio);
    if (paddedWidth > logicalMaxWidth) {
      paddedWidth = logicalMaxWidth;
      paddedHeight = Math.ceil(paddedWidth / sourceRatio);
    }
  }

  paddedWidth = Math.max(source.width, Math.min(logicalMaxWidth, paddedWidth));
  paddedHeight = Math.max(source.height, Math.min(logicalMaxHeight, paddedHeight));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const contentX = Math.floor(
    (outputSize.width - paddedWidth * integerScale) / 2,
  );
  const contentY = Math.floor(
    (outputSize.height - paddedHeight * integerScale) / 2,
  );
  const sourceX =
    contentX + Math.floor((paddedWidth - source.width) / 2) * integerScale;
  const sourceY =
    contentY + Math.floor((paddedHeight - source.height) / 2) * integerScale;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    source,
    sourceX,
    sourceY,
    source.width * integerScale,
    source.height * integerScale,
  );

  return await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
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
  pixelPerfectFit = true,
  showClearButton = true,
}: ImageInputProps) {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [previewUpscaled, setPreviewUpscaled] = useState(false);
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
  const numericWidth = toPositiveNumber(width);
  const numericHeight = toPositiveNumber(height);
  const outputMaxWidth =
    maxOutputWidth ?? maxOutputSize ?? numericWidth ?? 1024;
  const outputMaxHeight =
    maxOutputHeight ?? maxOutputSize ?? numericHeight ?? 1024;

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

  const getBaseScale = (
    frameWidth: number,
    frameHeight: number,
    sourceWidth: number,
    sourceHeight: number,
  ) => {
    const scaleByWidth = frameWidth / sourceWidth;
    const scaleByHeight = frameHeight / sourceHeight;
    return Math.min(scaleByWidth, scaleByHeight);
  };

  const getFillFrameZoom = (
    nextRotation = rotation,
    sourceSize = imageSize,
  ) => {
    const cropW = previewSize.width;
    const cropH = previewSize.height;
    if (!sourceSize.width || !sourceSize.height) return 1;
    const baseScale = getBaseScale(
      cropW,
      cropH,
      sourceSize.width,
      sourceSize.height,
    );
    const radians = (nextRotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const boundsW =
      sourceSize.width * baseScale * cos + sourceSize.height * baseScale * sin;
    const boundsH =
      sourceSize.width * baseScale * sin + sourceSize.height * baseScale * cos;
    if (!boundsW || !boundsH) return 1;
    return Math.max(1, cropW / boundsW, cropH / boundsH);
  };

  const getOutputSize = (sourceWidth: number, sourceHeight: number) => {
    const ratio = resolvedRatio || 1;
    let outputWidth = outputMaxWidth;
    let outputHeight = outputWidth / ratio;
    if (outputHeight > outputMaxHeight) {
      outputHeight = outputMaxHeight;
      outputWidth = outputHeight * ratio;
    }
    if (
      !pixelPerfectFit &&
      (outputWidth > sourceWidth || outputHeight > sourceHeight)
    ) {
      const downscale = Math.min(
        sourceWidth / outputWidth,
        sourceHeight / outputHeight,
      );
      outputWidth *= downscale;
      outputHeight *= downscale;
    }
    return {
      width: Math.max(1, Math.round(outputWidth)),
      height: Math.max(1, Math.round(outputHeight)),
    };
  };

  const updatePreviewUpscaled = useCallback(() => {
    const img = previewImageRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      setPreviewUpscaled(false);
      return;
    }
    const bounds = img.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const displayScale = Math.max(
      bounds.width / img.naturalWidth,
      bounds.height / img.naturalHeight,
    );
    setPreviewUpscaled(displayScale > 1.01);
  }, []);

  useEffect(() => {
    if (!value) {
      setPreviewUpscaled(false);
      return;
    }
    const img = previewImageRef.current;
    if (!img) return;

    const frame = window.requestAnimationFrame(updatePreviewUpscaled);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updatePreviewUpscaled);
    observer?.observe(img);
    window.addEventListener("resize", updatePreviewUpscaled);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", updatePreviewUpscaled);
    };
  }, [updatePreviewUpscaled, value, width, height, resolvedAspectRatio]);

  useEffect(() => {
    if (!cropSrc) return;
    const img = new Image();
    img.onload = () => {
      const nextImageSize = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      const nextZoom = getFillFrameZoom(0, nextImageSize);
      setImageSize(nextImageSize);
      setZoom(nextZoom);
      setOffset({ x: 0, y: 0 });
    };
    img.src = cropSrc;
  }, [cropSrc, previewSize.height, previewSize.width]);

  const clampOffset = (
    nextOffset: { x: number; y: number },
    nextZoom: number,
    nextRotation = rotation,
  ) => {
    const cropW = previewSize.width;
    const cropH = previewSize.height;
    if (!imageSize.width || !imageSize.height) return nextOffset;
    const baseScale = getBaseScale(
      cropW,
      cropH,
      imageSize.width,
      imageSize.height,
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

  const handleFillFrame = () => {
    const nextZoom = getFillFrameZoom();
    setZoom(nextZoom);
    setOffset((prev) => clampOffset(prev, nextZoom, rotation));
  };

  const handleFitImage = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
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
    setSaving(true);

    try {
      const img = new Image();
      img.src = cropSrc;
      await img.decode();

      const cropW = Math.max(1, Math.round(previewSize.width));
      const cropH = Math.max(1, Math.round(previewSize.height));
      const previewBaseScale = getBaseScale(
        cropW,
        cropH,
        img.naturalWidth,
        img.naturalHeight,
      );
      const previewScale = previewBaseScale * zoom;
      const isAnimatedGif =
        cropFile.type === "image/gif" &&
        rotation % 360 === 0 &&
        !flipX &&
        !flipY;

      if (isAnimatedGif) {
        const scaledW = img.naturalWidth * previewScale;
        const scaledH = img.naturalHeight * previewScale;
        const frameCovered =
          scaledW + 0.01 >= cropW && scaledH + 0.01 >= cropH;
        let cropData: ImageCropData | undefined;

        if (frameCovered) {
          const imgLeft = (cropW - scaledW) / 2 + offset.x;
          const imgTop = (cropH - scaledH) / 2 + offset.y;
          const sourceX = Math.max(0, -imgLeft / previewScale);
          const sourceY = Math.max(0, -imgTop / previewScale);
          const sourceW = Math.min(img.naturalWidth, cropW / previewScale);
          const sourceH = Math.min(img.naturalHeight, cropH / previewScale);
          const nextCropData: ImageCropData = {
            left: Math.max(0, Math.round(sourceX)),
            top: Math.max(0, Math.round(sourceY)),
            width: Math.max(1, Math.round(sourceW)),
            height: Math.max(1, Math.round(sourceH)),
          };
          const coversWholeImage =
            nextCropData.left === 0 &&
            nextCropData.top === 0 &&
            nextCropData.width >= img.naturalWidth &&
            nextCropData.height >= img.naturalHeight;
          cropData = coversWholeImage ? undefined : nextCropData;
        }

        await onSelect(cropFile, cropData);
        handleCloseCrop();
        return;
      }

      const outputSize = getOutputSize(img.naturalWidth, img.naturalHeight);
      if (pixelPerfectFit && isNearDefaultCrop(zoom, offset)) {
        const sourceCanvas = createTransformedSourceCanvas(
          img,
          rotation,
          flipX,
          flipY,
        );
        const pixelPerfectBlob = sourceCanvas
          ? await renderPixelPerfectFitBlob(sourceCanvas, outputSize)
          : null;
        if (pixelPerfectBlob) {
          const croppedFile = new File(
            [pixelPerfectBlob],
            replaceFileExtension(cropFile.name, ".png"),
            { type: pixelPerfectBlob.type },
          );
          await onSelect(croppedFile);
          handleCloseCrop();
          return;
        }
      }

      const outputScale = outputSize.width / cropW;
      const baseScale = getBaseScale(
        outputSize.width,
        outputSize.height,
        img.naturalWidth,
        img.naturalHeight,
      );
      const scale = baseScale * zoom;
      const radians = (rotation * Math.PI) / 180;
      const canvas = document.createElement("canvas");
      canvas.width = outputSize.width;
      canvas.height = outputSize.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        handleCloseCrop();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = scale <= 1;
      if (ctx.imageSmoothingEnabled) {
        ctx.imageSmoothingQuality = "high";
      }
      ctx.translate(
        canvas.width / 2 + offset.x * outputScale,
        canvas.height / 2 + offset.y * outputScale,
      );
      ctx.rotate(radians);
      ctx.scale((flipX ? -1 : 1) * scale, (flipY ? -1 : 1) * scale);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, cropFile.type || "image/png", 0.85),
      );
      if (!blob) {
        handleCloseCrop();
        return;
      }

      const croppedFile = new File([blob], cropFile.name, { type: blob.type });
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
        transformOrigin: "center",
        userSelect: "none",
        pointerEvents: "none",
      } as const;
    }
    const cropW = previewSize.width;
    const cropH = previewSize.height;
    const baseScale = getBaseScale(
      cropW,
      cropH,
      imageSize.width,
      imageSize.height,
    );
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
      imageRendering: displayScale > 1.01 ? "pixelated" : "auto",
    } as const;
  })();
  const fillFrameZoom = getFillFrameZoom();
  const maxZoom = Math.max(4, Math.ceil(fillFrameZoom * 100) / 100);

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
            aria-label={uiText("AppStrings.RemoveImage")}
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
              ref={previewImageRef}
              src={value}
              alt={placeholder}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onLoad={updatePreviewUpscaled}
              style={{
                imageRendering: previewUpscaled ? "pixelated" : "auto",
              }}
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
                 {uiText("AppStrings.CropImage")} </Text>
              <Text size="sm" color="textFaded">
                 {uiText("AppStrings.DragToPositionAndZoomToFit")} </Text>
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
                    alt={uiText("AppStrings.CropPreview")}
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
                   {uiText("AppStrings.Zoom")} </Text>
                <input
                  type="range"
                  min={1}
                  max={maxZoom}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => {
                    const nextZoom = Number(event.target.value);
                    setZoom(nextZoom);
                    setOffset((prev) => clampOffset(prev, nextZoom, rotation));
                  }}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button size="sm" color="default" onClick={handleFitImage}>
                    {uiText("AppStrings.FitImage")}
                  </Button>
                  <Button size="sm" color="default" onClick={handleFillFrame}>
                    {uiText("AppStrings.FillFrame")}
                  </Button>
                  <Button
                    size="sm"
                    color={flipX ? "blue" : "default"}
                    onClick={() => setFlipX((prev) => !prev)}
                  >
                     {uiText("AppStrings.FlipHorizontal")} </Button>
                  <Button
                    size="sm"
                    color={flipY ? "blue" : "default"}
                    onClick={() => setFlipY((prev) => !prev)}
                  >
                     {uiText("AppStrings.FlipVertical")} </Button>
                  <Button
                    size="sm"
                    color="default"
                    onClick={() => {
                      const next = ((rotation - 90) % 360 + 360) % 360;
                      setRotation(next);
                      setOffset((prev) => clampOffset(prev, zoom, next));
                    }}
                  >
                     {uiText("AppStrings.RotateLeft")} </Button>
                  <Button
                    size="sm"
                    color="default"
                    onClick={() => {
                      const next = (rotation + 90) % 360;
                      setRotation(next);
                      setOffset((prev) => clampOffset(prev, zoom, next));
                    }}
                  >
                     {uiText("AppStrings.RotateRight")} </Button>
                </div>
              </Vstack>
            </Vstack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseCrop} disabled={saving}>
               {uiText("AppStrings.Cancel")} </Button>
            <Button color="blue" onClick={handleConfirmCrop} loading={saving}>
               {uiText("Settings.Save.Title")} </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
