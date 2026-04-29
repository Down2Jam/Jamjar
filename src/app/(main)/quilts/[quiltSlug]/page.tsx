"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "@/compat/next-navigation";
import { Minus, Pencil, Plus, ThumbsDown, ThumbsUp } from "lucide-react";
import {
  addToast,
  Button,
  Card,
  Hstack,
  Spinner,
  Text,
  Vstack,
} from "bioloom-ui";
import { hasCookie } from "@/helpers/cookie";
import { useSelf } from "@/hooks/queries";
import {
  getQuilt,
  removeQuiltSubmission,
  submitQuiltPixels,
  updateQuiltSubmission,
  voteQuiltSubmission,
  type QuiltDetail,
  type QuiltPixel,
  type QuiltSubmission,
} from "@/requests/quilt";
import { readItem } from "@/requests/helpers";

const PALETTE = [
  "#ffffff",
  "#b9c3cf",
  "#777f8c",
  "#424651",
  "#1f1e26",
  "#000000",
  "#382215",
  "#7c3f20",
  "#c06f37",
  "#fead6c",
  "#ffd2b1",
  "#ffa4d0",
  "#f14fb4",
  "#e973ff",
  "#a630d2",
  "#531d8c",
  "#242367",
  "#0334bf",
  "#149cff",
  "#8df5ff",
  "#01bfa5",
  "#16777e",
  "#054523",
  "#18862f",
  "#61e021",
  "#b1ff37",
  "#ffffa5",
  "#fde111",
  "#ff9f17",
  "#f66e08",
  "#550022",
  "#99011a",
  "#f30f0c",
  "#ff7872",
];

type Tool = "brush" | "eraser" | "bucket" | "transform";
type Rect = { x: number; y: number; width: number; height: number };
type DragMode =
  | { type: "draw" }
  | { type: "select"; start: { x: number; y: number } }
  | {
      type: "move";
      start: { x: number; y: number };
      source: Array<{ x: number; y: number; color: string | null }>;
    };
type CanvasPreview =
  | { type: "current" }
  | { type: "history"; id: number }
  | { type: "pending"; id: number }
  | { type: "rejected"; id: number }
  | { type: "removed"; id: number };

function keyFor(x: number, y: number) {
  return `${x}:${y}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRect(a: { x: number; y: number }, b: { x: number; y: number }): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.abs(a.x - b.x) + 1,
    height: Math.abs(a.y - b.y) + 1,
  };
}

function contains(rect: Rect | null, point: { x: number; y: number }) {
  return (
    rect &&
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x < rect.x + rect.width &&
    point.y < rect.y + rect.height
  );
}

function composePixelSubmissions(
  width: number,
  height: number,
  submissions: Array<{ pixels: QuiltPixel[] }>,
) {
  const stacks = Array.from({ length: width * height }, () => [] as string[]);
  for (const submission of submissions) {
    for (const pixel of submission.pixels) {
      if (pixel.x < 0 || pixel.y < 0 || pixel.x >= width || pixel.y >= height) {
        continue;
      }
      const index = pixel.y * width + pixel.x;
      if (pixel.color === null) stacks[index].pop();
      else stacks[index].push(pixel.color);
    }
  }
  return stacks.map((stack) => stack.at(-1) ?? null);
}

function composeFromHistory(
  width: number,
  height: number,
  history: QuiltSubmission[],
  throughId?: number | null,
  extraPixels: QuiltPixel[] = [],
) {
  const historySlice: Array<{ pixels: QuiltPixel[] }> = [];
  for (const submission of history) {
    historySlice.push(submission);
    if (throughId && submission.id === throughId) break;
  }
  if (extraPixels.length) {
    historySlice.push({ pixels: extraPixels });
  }
  return composePixelSubmissions(width, height, historySlice);
}

function wasSubmissionVisibleAt(
  submission: QuiltSubmission,
  timestamp: number,
) {
  return (
    new Date(submission.createdAt).getTime() <= timestamp &&
    (!submission.removedAt || new Date(submission.removedAt).getTime() > timestamp)
  );
}

function getSubmissionStackAtOriginalTime(
  quilt: QuiltDetail,
  submission: QuiltSubmission,
) {
  const timestamp = new Date(submission.createdAt).getTime();
  const visibleBase = [...quilt.history, ...quilt.removed]
    .filter((candidate) => candidate.id !== submission.id)
    .filter((candidate) => wasSubmissionVisibleAt(candidate, timestamp))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  return [
    ...visibleBase,
    { pixels: submission.pixels },
  ];
}

export default function QuiltDetailPage() {
  const params = useParams<{ quiltSlug: string }>();
  const quiltSlug = params.quiltSlug;
  const [quilt, setQuilt] = useState<QuiltDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState(PALETTE[0]);
  const [brushSize, setBrushSize] = useState(1);
  const [zoom, setZoom] = useState(10);
  const [draft, setDraft] = useState<Map<string, string | null>>(() => new Map());
  const [editingSubmissionId, setEditingSubmissionId] = useState<number | null>(null);
  const [preview, setPreview] = useState<CanvasPreview>({ type: "current" });
  const [selection, setSelection] = useState<Rect | null>(null);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<DragMode | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasToken = hasCookie("token");
  const { data: user } = useSelf(hasToken);
  const isModerator = Boolean(user?.admin || user?.mod);
  const isEditing = draft.size > 0 || editingSubmissionId !== null;
  const activePreview: CanvasPreview = isEditing ? { type: "current" } : preview;

  const loadQuilt = useCallback(async () => {
    if (!quiltSlug) return;
    setLoading(true);
    try {
      const response = await getQuilt(quiltSlug);
      if (response.ok) {
        setQuilt(await readItem<QuiltDetail>(response));
      }
    } finally {
      setLoading(false);
    }
  }, [quiltSlug]);

  useEffect(() => {
    loadQuilt();
  }, [loadQuilt]);

  const viewCanvas = useMemo(() => {
    if (!quilt) return [];
    if (activePreview.type === "rejected" || activePreview.type === "removed") {
      const submission =
        activePreview.type === "rejected"
          ? quilt.rejected.find((item) => item.id === activePreview.id)
          : quilt.removed.find((item) => item.id === activePreview.id);
      if (submission) {
        const draftPixels = Array.from(draft.entries()).map(([key, value]) => {
          const [x, y] = key.split(":").map(Number);
          return { x, y, color: value };
        });
        return composePixelSubmissions(quilt.width, quilt.height, [
          ...getSubmissionStackAtOriginalTime(quilt, submission),
          { pixels: draftPixels },
        ]);
      }
    }
    const previewPixels =
      activePreview.type === "pending"
        ? (quilt.pending.find((submission) => submission.id === activePreview.id)?.pixels ?? [])
        : [];
    const draftPixels = Array.from(draft.entries()).map(([key, value]) => {
      const [x, y] = key.split(":").map(Number);
      return { x, y, color: value };
    });
    return composeFromHistory(
      quilt.width,
      quilt.height,
      quilt.history,
      activePreview.type === "history" ? activePreview.id : null,
      [...previewPixels, ...draftPixels],
    );
  }, [activePreview, draft, quilt]);

  const drawPixel = useCallback(
    (x: number, y: number, nextColor: string | null) => {
      if (!quilt) return;
      setDraft((current) => {
        const next = new Map(current);
        const radius = Math.max(1, brushSize);
        for (let oy = 0; oy < radius; oy++) {
          for (let ox = 0; ox < radius; ox++) {
            const px = x + ox;
            const py = y + oy;
            if (px >= 0 && py >= 0 && px < quilt.width && py < quilt.height) {
              next.set(keyFor(px, py), nextColor);
            }
          }
        }
        return next;
      });
    },
    [brushSize, quilt],
  );

  const bucketFill = useCallback(
    (x: number, y: number, nextColor: string | null) => {
      if (!quilt) return;
      const target = viewCanvas[y * quilt.width + x] ?? null;
      if (target === nextColor) return;
      const queued = [{ x, y }];
      const seen = new Set<string>();
      const changes = new Map<string, string | null>();

      while (queued.length) {
        const point = queued.pop()!;
        const pointKey = keyFor(point.x, point.y);
        if (seen.has(pointKey)) continue;
        seen.add(pointKey);
        if ((viewCanvas[point.y * quilt.width + point.x] ?? null) !== target) continue;
        changes.set(pointKey, nextColor);
        for (const nextPoint of [
          { x: point.x + 1, y: point.y },
          { x: point.x - 1, y: point.y },
          { x: point.x, y: point.y + 1 },
          { x: point.x, y: point.y - 1 },
        ]) {
          if (
            nextPoint.x >= 0 &&
            nextPoint.y >= 0 &&
            nextPoint.x < quilt.width &&
            nextPoint.y < quilt.height
          ) {
            queued.push(nextPoint);
          }
        }
      }
      setDraft((current) => new Map([...current, ...changes]));
    },
    [quilt, viewCanvas],
  );

  const getPointerCell = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!quilt || !canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: clamp(Math.floor(((event.clientX - rect.left) / rect.width) * quilt.width), 0, quilt.width - 1),
        y: clamp(Math.floor(((event.clientY - rect.top) / rect.height) * quilt.height), 0, quilt.height - 1),
      };
    },
    [quilt],
  );

  const setZoomLevel = useCallback((nextZoom: number) => {
    setZoom(clamp(nextZoom, 2, 32));
  }, []);

  const handleCanvasWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!quilt || !canvasRef.current || !viewportRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      const viewport = viewportRef.current;
      const canvas = canvasRef.current;
      const canvasRect = canvas.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      const pixelX = clamp(
        ((event.clientX - canvasRect.left) / canvasRect.width) * quilt.width,
        0,
        quilt.width,
      );
      const pixelY = clamp(
        ((event.clientY - canvasRect.top) / canvasRect.height) * quilt.height,
        0,
        quilt.height,
      );
      const nextZoom = clamp(zoom + (event.deltaY < 0 ? 1 : -1), 2, 32);
      if (nextZoom === zoom) return;
      setZoom(nextZoom);
      requestAnimationFrame(() => {
        viewport.scrollLeft = pixelX * nextZoom - (event.clientX - viewportRect.left);
        viewport.scrollTop = pixelY * nextZoom - (event.clientY - viewportRect.top);
      });
    },
    [quilt, zoom],
  );

  useEffect(() => {
    if (!quilt || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = quilt.width;
    canvas.height = quilt.height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, quilt.width, quilt.height);
    for (let y = 0; y < quilt.height; y++) {
      for (let x = 0; x < quilt.width; x++) {
        ctx.fillStyle = viewCanvas[y * quilt.width + x] ?? "#ffffff";
        ctx.fillRect(x, y, 1, 1);
      }
    }
    if (selection) {
      ctx.strokeStyle = "#8df5ff";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        selection.x + 0.05 + moveOffset.x,
        selection.y + 0.05 + moveOffset.y,
        Math.max(0, selection.width - 0.1),
        Math.max(0, selection.height - 0.1),
      );
    }
  }, [moveOffset, quilt, selection, viewCanvas]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const cell = getPointerCell(event);
    if (!cell || !quilt) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (tool === "bucket") {
      bucketFill(cell.x, cell.y, color);
      return;
    }
    if (tool === "transform") {
      if (contains(selection, cell)) {
        const source: Array<{ x: number; y: number; color: string | null }> = [];
        for (let y = selection!.y; y < selection!.y + selection!.height; y++) {
          for (let x = selection!.x; x < selection!.x + selection!.width; x++) {
            source.push({ x, y, color: viewCanvas[y * quilt.width + x] ?? null });
          }
        }
        setDrag({ type: "move", start: cell, source });
        return;
      }
      setSelection({ x: cell.x, y: cell.y, width: 1, height: 1 });
      setMoveOffset({ x: 0, y: 0 });
      setDrag({ type: "select", start: cell });
      return;
    }
    drawPixel(cell.x, cell.y, tool === "eraser" ? null : color);
    setDrag({ type: "draw" });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const cell = getPointerCell(event);
    if (!cell || !drag || !quilt) return;
    if (drag.type === "draw") {
      drawPixel(cell.x, cell.y, tool === "eraser" ? null : color);
      return;
    }
    if (drag.type === "select") {
      setSelection(normalizeRect(drag.start, cell));
      return;
    }
    const nextOffset = {
      x: clamp(cell.x - drag.start.x, -(selection?.x ?? 0), quilt.width - ((selection?.x ?? 0) + (selection?.width ?? 0))),
      y: clamp(cell.y - drag.start.y, -(selection?.y ?? 0), quilt.height - ((selection?.y ?? 0) + (selection?.height ?? 0))),
    };
    setMoveOffset(nextOffset);
  }

  function handlePointerUp() {
    if (drag?.type === "move" && quilt && selection) {
      const offset = moveOffset;
      setDraft((current) => {
        const next = new Map(current);
        for (const pixel of drag.source) {
          next.set(keyFor(pixel.x, pixel.y), null);
        }
        for (const pixel of drag.source) {
          const nx = pixel.x + offset.x;
          const ny = pixel.y + offset.y;
          if (pixel.color && nx >= 0 && ny >= 0 && nx < quilt.width && ny < quilt.height) {
            next.set(keyFor(nx, ny), pixel.color);
          }
        }
        return next;
      });
      setSelection({
        x: selection.x + offset.x,
        y: selection.y + offset.y,
        width: selection.width,
        height: selection.height,
      });
      setMoveOffset({ x: 0, y: 0 });
    }
    setDrag(null);
  }

  async function submitDraft() {
    if (!quilt || draft.size === 0) return;
    const pixels: QuiltPixel[] = Array.from(draft.entries()).map(([key, value]) => {
      const [x, y] = key.split(":").map(Number);
      return { x, y, color: value };
    });
    const response = editingSubmissionId
      ? await updateQuiltSubmission(editingSubmissionId, pixels)
      : await submitQuiltPixels(quilt.slug, pixels);
    if (response.ok) {
      const next = await readItem<QuiltDetail>(response);
      setQuilt(next);
      setDraft(new Map());
      setEditingSubmissionId(null);
      setSelection(null);
      setPreview({ type: "current" });
      addToast({
        title: editingSubmissionId
          ? "Quilt change updated"
          : "Quilt change submitted",
      });
    } else {
      addToast({ title: "Could not save quilt change", color: "danger" });
    }
  }

  function startEditingSubmission(submission: QuiltSubmission) {
    setDraft(
      new Map(
        submission.pixels.map((pixel) => [
          keyFor(pixel.x, pixel.y),
          pixel.color,
        ]),
      ),
    );
    setEditingSubmissionId(submission.id);
    setPreview({ type: "pending", id: submission.id });
    setSelection(null);
    addToast({ title: "Loaded pending change for editing" });
  }

  async function vote(id: number, value: 1 | -1) {
    const response = await voteQuiltSubmission(id, value);
    if (response.ok) setQuilt(await readItem<QuiltDetail>(response));
  }

  async function removeSubmission(id: number) {
    const response = await removeQuiltSubmission(id);
    if (response.ok) setQuilt(await readItem<QuiltDetail>(response));
  }

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center gap-3">
        <Spinner />
        <Text color="textFaded">Loading quilt...</Text>
      </main>
    );
  }

  if (!quilt) {
    return (
      <main className="mx-auto max-w-5xl px-4">
        <Card>
          <Text color="textFaded">Quilt not found.</Text>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 pb-10">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Vstack align="stretch" className="min-w-0 gap-4">
          <Hstack justify="between" className="flex-wrap gap-3">
            <Vstack align="start" gap={0}>
              <Text size="3xl" weight="bold" color="text">
                {quilt.name}
              </Text>
              <Text color="textFaded">
                {quilt.width} x {quilt.height} pixels · Ends {formatTime(quilt.endsAt)}
                {activePreview.type === "history" && " · Viewing history"}
                {activePreview.type === "pending" && " · Previewing pending change"}
                {activePreview.type === "rejected" && " · Previewing rejected change"}
                {activePreview.type === "removed" && " · Previewing removed change"}
              </Text>
            </Vstack>
            <Hstack>
              {activePreview.type !== "current" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreview({ type: "current" })}
                >
                  Current canvas
                </Button>
              )}
              <Button size="sm" icon="rotateccw" onClick={loadQuilt}>
                Refresh
              </Button>
            </Hstack>
          </Hstack>

          <Card>
            <Vstack align="stretch" className="gap-3">
              <div
                ref={viewportRef}
                className="h-[620px] max-h-[70vh] min-h-[420px] w-full max-w-full overscroll-contain overflow-auto rounded border border-white/10 bg-black/30 p-2"
                onWheel={handleCanvasWheel}
              >
                <canvas
                  ref={canvasRef}
                  className="mx-auto block cursor-crosshair border border-white/15 bg-white [image-rendering:pixelated]"
                  style={{
                    width: quilt.width * zoom,
                    height: quilt.height * zoom,
                    maxWidth: "none",
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
              </div>

              <Hstack className="flex-wrap gap-2">
                {(["brush", "bucket", "eraser", "transform"] as Tool[]).map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    color={tool === item ? "blue" : "default"}
                    variant={tool === item ? undefined : "ghost"}
                    onClick={() => setTool(item)}
                  >
                    {item[0].toUpperCase() + item.slice(1)}
                  </Button>
                ))}
                <label className="ml-auto flex items-center gap-2 text-sm text-zinc-400">
                  Brush
                  <input
                    className="w-20"
                    type="range"
                    min={1}
                    max={6}
                    value={brushSize}
                    onChange={(event) => setBrushSize(Number(event.target.value))}
                  />
                  {brushSize}px
                </label>
              </Hstack>

              <Hstack className="flex-wrap gap-2">
                <Text color="textFaded" size="sm">
                  Zoom
                </Text>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                  title="Zoom out"
                  onClick={() => setZoom((value) => Math.max(2, value - 2))}
                >
                  <Minus size={16} />
                </button>
                <input
                  className="w-48"
                  type="range"
                  min={2}
                  max={32}
                  step={1}
                  value={zoom}
                  onChange={(event) => setZoomLevel(Number(event.target.value))}
                />
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                  title="Zoom in"
                  onClick={() => setZoom((value) => clamp(value + 2, 2, 32))}
                >
                  <Plus size={16} />
                </button>
                <Text color="textFaded" size="sm">
                  {zoom}x
                </Text>
                <Button size="sm" variant="ghost" onClick={() => setZoomLevel(10)}>
                  Reset
                </Button>
              </Hstack>

              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(2rem, 1fr))" }}
              >
                {PALETTE.map((paletteColor) => (
                  <button
                    key={paletteColor}
                    className={`h-8 rounded border transition-transform hover:scale-110 ${
                      color === paletteColor ? "border-white" : "border-white/20"
                    }`}
                    style={{ backgroundColor: paletteColor }}
                    title={paletteColor}
                    onClick={() => {
                      setColor(paletteColor);
                      if (tool === "eraser") setTool("brush");
                    }}
                  />
                ))}
              </div>

              <Hstack justify="between" className="flex-wrap gap-2">
                <Text color="textFaded">
                  {editingSubmissionId
                    ? `${draft.size} pending pixel changes · editing existing submission`
                    : `${draft.size} pending pixel changes`}
                </Text>
                <Hstack>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDraft(new Map());
                      setEditingSubmissionId(null);
                    }}
                  >
                    Clear draft
                  </Button>
                  <Button
                    size="sm"
                    icon="send"
                    color="blue"
                    disabled={
                      !user ||
                      draft.size === 0 ||
                      quilt.isEnded
                    }
                    onClick={submitDraft}
                  >
                    {editingSubmissionId ? "Save edit" : "Submit changes"}
                  </Button>
                </Hstack>
              </Hstack>
            </Vstack>
          </Card>
        </Vstack>

        <Vstack align="stretch" className="gap-4">
          <HistoryPanel
            title="History"
            submissions={quilt.history}
            selectedId={activePreview.type === "history" ? activePreview.id : null}
            previewDisabled={isEditing}
            onSelect={(id) => {
              if (isEditing) return;
              setPreview((current) =>
                current.type === "history" && current.id === id
                  ? { type: "current" }
                  : { type: "history", id },
              );
            }}
            isModerator={isModerator}
            onRemove={removeSubmission}
          />
          <PendingPanel
            submissions={quilt.pending}
            selectedId={activePreview.type === "pending" ? activePreview.id : null}
            currentUserId={user?.id}
            previewDisabled={isEditing}
            onSelect={(id) => {
              if (isEditing) return;
              setPreview((current) =>
                current.type === "pending" && current.id === id
                  ? { type: "current" }
                  : { type: "pending", id },
              );
            }}
            onEdit={startEditingSubmission}
            onVote={vote}
            isModerator={isModerator}
            onRemove={removeSubmission}
          />
          <HistoryPanel
            title="Rejected"
            submissions={quilt.rejected}
            selectedId={activePreview.type === "rejected" ? activePreview.id : null}
            previewDisabled={isEditing}
            onSelect={(id) => {
              if (isEditing) return;
              setPreview((current) =>
                current.type === "rejected" && current.id === id
                  ? { type: "current" }
                  : { type: "rejected", id },
              );
            }}
          />
          {quilt.removed.length > 0 && (
            <HistoryPanel
              title="Removed"
              submissions={quilt.removed}
              selectedId={activePreview.type === "removed" ? activePreview.id : null}
              previewDisabled={isEditing}
              onSelect={(id) => {
                if (isEditing) return;
                setPreview((current) =>
                  current.type === "removed" && current.id === id
                    ? { type: "current" }
                    : { type: "removed", id },
                );
              }}
            />
          )}
        </Vstack>
      </div>
    </main>
  );
}

function HistoryPanel({
  title,
  submissions,
  selectedId,
  previewDisabled,
  isModerator,
  onSelect,
  onRemove,
}: {
  title: string;
  submissions: QuiltSubmission[];
  selectedId?: number | null;
  previewDisabled?: boolean;
  isModerator?: boolean;
  onSelect?: (id: number) => void;
  onRemove?: (id: number) => void;
}) {
  return (
    <Card>
      <Vstack align="stretch" className="gap-3">
        <Text size="lg" weight="semibold" color="text">
          {title}
        </Text>
        {submissions.length === 0 ? (
          <Text color="textFaded" size="sm">
            Nothing here yet.
          </Text>
        ) : (
          submissions
            .slice()
            .reverse()
            .map((submission) => (
              <button
                key={submission.id}
                className={`rounded border p-3 text-left transition-colors ${
                  selectedId === submission.id
                    ? "border-cyan-300/70 bg-cyan-300/10"
                    : previewDisabled
                      ? "cursor-default border-white/10 bg-white/[0.03]"
                      : "cursor-pointer border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
                onClick={() => onSelect?.(submission.id)}
              >
                <Hstack justify="between" className="gap-3">
                  <Vstack align="start" gap={0}>
                    <Text color="text" weight="semibold">
                      {submission.author.name}
                    </Text>
                    <Text color="textFaded" size="xs">
                      {submission.pixels.length} pixels · {formatTime(submission.createdAt)}
                    </Text>
                  </Vstack>
                  {isModerator && submission.status === "ACCEPTED" && (
                    <Button
                      size="sm"
                      icon="trash"
                      variant="ghost"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove?.(submission.id);
                      }}
                    />
                  )}
                </Hstack>
              </button>
            ))
        )}
      </Vstack>
    </Card>
  );
}

function PendingPanel({
  submissions,
  selectedId,
  currentUserId,
  previewDisabled,
  isModerator,
  onSelect,
  onEdit,
  onVote,
  onRemove,
}: {
  submissions: QuiltSubmission[];
  selectedId?: number | null;
  currentUserId?: number;
  previewDisabled?: boolean;
  isModerator?: boolean;
  onSelect: (id: number) => void;
  onEdit: (submission: QuiltSubmission) => void;
  onVote: (id: number, value: 1 | -1) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <Card>
      <Vstack align="stretch" className="gap-3">
        <Text size="lg" weight="semibold" color="text">
          Pending
        </Text>
        {submissions.length === 0 ? (
          <Text color="textFaded" size="sm">
            No pending changes.
          </Text>
        ) : (
          submissions
            .slice()
            .reverse()
            .map((submission) => (
              <button
                key={submission.id}
                className={`rounded border p-3 text-left transition-colors ${
                  selectedId === submission.id
                    ? "border-cyan-300/70 bg-cyan-300/10"
                    : previewDisabled
                      ? "cursor-default border-white/10 bg-white/[0.03]"
                      : "cursor-pointer border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
                onClick={() => onSelect(submission.id)}
              >
                <Hstack justify="between" className="gap-3">
                  <Vstack align="start" gap={0}>
                    <Text color="text" weight="semibold">
                      {submission.author.name}
                    </Text>
                    <Text color="textFaded" size="xs">
                      Resolves {formatTime(submission.resolvesAt)}
                    </Text>
                  </Vstack>
                  <Hstack className="gap-1">
                    {currentUserId === submission.author.id && (
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                        title="Edit"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(submission);
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    <button
                      className={`inline-flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/10 ${
                        submission.viewerVote === 1
                          ? "text-cyan-300"
                          : "text-zinc-300 hover:text-white"
                      }`}
                      title="Upvote"
                      onClick={(event) => {
                        event.stopPropagation();
                        onVote(submission.id, 1);
                      }}
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <span className="min-w-6 text-center text-sm text-zinc-300">
                      {submission.score}
                    </span>
                    <button
                      className={`inline-flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/10 ${
                        submission.viewerVote === -1
                          ? "text-red-300"
                          : "text-zinc-300 hover:text-white"
                      }`}
                      title="Downvote"
                      onClick={(event) => {
                        event.stopPropagation();
                        onVote(submission.id, -1);
                      }}
                    >
                      <ThumbsDown size={16} />
                    </button>
                    {isModerator && (
                      <Button
                        size="sm"
                        icon="trash"
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemove(submission.id);
                        }}
                      />
                    )}
                  </Hstack>
                </Hstack>
              </button>
            ))
        )}
      </Vstack>
    </Card>
  );
}
