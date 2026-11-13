import type { AssetId, AssetSize } from "../../types/types";
import { CATALOG, FRAME, clamp, layerDimensions, type Layer, type Point } from "./scene";

export const LAYOUTS = ["В центре", "Со смещением", "Под заголовок"] as const;
export type LayoutIndex = 0 | 1 | 2;

type Rectangle = { left: number; top: number; right: number; bottom: number };
type Anchor = Point & { size: number; angle: number };

const FRAME_RECT = { left: 0, top: 0, right: FRAME.width, bottom: FRAME.height };
const TITLE_RECT = { ...FRAME_RECT, left: 450 };
const ANCHORS: Record<LayoutIndex, Anchor[]> = {
  0: [
    { x: 593, y: 323, size: 375, angle: -6 }, { x: 844, y: 381, size: 265, angle: 10 },
    { x: 340, y: 275, size: 235, angle: -12 }, { x: 812, y: 167, size: 190, angle: -8 },
    { x: 416, y: 464, size: 173, angle: 9 }, { x: 985, y: 230, size: 175, angle: 13 },
  ],
  1: [
    { x: 401, y: 362, size: 390, angle: 8 }, { x: 715, y: 219, size: 273, angle: -9 },
    { x: 897, y: 397, size: 235, angle: 10 }, { x: 205, y: 170, size: 180, angle: -9 },
    { x: 714, y: 471, size: 171, angle: -8 }, { x: 1088, y: 224, size: 170, angle: 12 },
  ],
  2: [
    { x: 823, y: 319, size: 335, angle: -6 }, { x: 1039, y: 411, size: 221, angle: 12 },
    { x: 592, y: 205, size: 192, angle: -12 }, { x: 1014, y: 149, size: 166, angle: -8 },
    { x: 590, y: 452, size: 150, angle: 11 }, { x: 1128, y: 260, size: 147, angle: 8 },
  ],
};

function bounds(layer: Layer, size: AssetSize): Rectangle {
  const { width, height } = layerDimensions(layer, CATALOG[layer.assetId].dimensions[size]);
  const angle = layer.angle * Math.PI / 180;
  const sin = Math.abs(Math.sin(angle));
  const cos = Math.abs(Math.cos(angle));
  const halfWidth = (width * cos + height * sin) / 2;
  const halfHeight = (height * cos + width * sin) / 2;
  return { left: layer.x - halfWidth, right: layer.x + halfWidth, top: layer.y - halfHeight, bottom: layer.y + halfHeight };
}

const area = (rect: Rectangle) => (rect.right - rect.left) * (rect.bottom - rect.top);

function intersection(a: Rectangle, b: Rectangle) {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return Math.max(0, width) * Math.max(0, height);
}

function place(layer: Layer, size: AssetSize, region: Rectangle, placed: { box: Rectangle; role: Layer["role"] }[]) {
  const box = bounds(layer, size);
  const halfWidth = (box.right - box.left) / 2;
  const halfHeight = (box.bottom - box.top) / 2;
  const bleed = layer.role === "background" ? 10 : -24;
  const maxCrop = layer.role === "background" ? 0.08 : 0;
  const step = layer.size * 0.19;
  const shifts = [0, -1, 1, -2, 2];
  let best: { layer: Layer; box: Rectangle; score: number } | undefined;

  for (const factor of [1, 0.9, 0.78, 0.66]) {
    for (const dx of shifts) {
      for (const dy of shifts) {
        const candidate = {
          ...layer,
          size: layer.size * factor,
          x: clamp(layer.x + dx * step, region.left + halfWidth * factor - bleed, region.right - halfWidth * factor + bleed),
          y: clamp(layer.y + dy * step, region.top + halfHeight * factor - bleed, region.bottom - halfHeight * factor + bleed),
        };
        const box = bounds(candidate, size);
        const boxArea = area(box);
        const crop = Math.max(0, 1 - intersection(box, region) / boxArea);
        if (crop > maxCrop + 1e-9) continue;

        let overlapCost = 0;
        for (const other of placed) {
          const ratio = intersection(box, other.box) / Math.min(boxArea, area(other.box));
          const allowed = layer.role === "background" ? 0.32 : other.role === "focus" ? 0.12 : 0.08;
          overlapCost += ratio * 0.14 + Math.max(0, ratio - allowed) * 9;
        }
        const distance = Math.hypot(candidate.x - layer.x, candidate.y - layer.y);
        const score = distance / 350 + (1 - factor) * 2.4 + crop * 0.9 + overlapCost;
        if (!best || score < best.score) best = { layer: candidate, box, score };
      }
    }
  }

  // A reduced candidate fits every supplied viewBox. Keep the anchor as a fallback for future inputs.
  return best ?? { layer, box, score: Infinity };
}

function gridAnchor(index: number, count: number, layout: LayoutIndex): Anchor {
  const region = layout === 2 ? TITLE_RECT : FRAME_RECT;
  const width = region.right - region.left - 48;
  const height = FRAME.height - 48;
  const columns = Math.ceil(Math.sqrt(count * width / height));
  const rows = Math.ceil(count / columns);
  const row = Math.floor(index / columns);
  const column = index % columns;
  const rowCount = Math.min(columns, count - row * columns);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const direction = layout === 1 ? rowCount - column - 1 : column;
  return {
    x: region.left + 24 + (direction + (columns - rowCount) / 2 + 0.5) * cellWidth,
    y: 24 + (row + 0.5) * cellHeight,
    size: Math.min(cellWidth, cellHeight) * (index === 0 ? 0.85 : 0.69),
    angle: (index % 2 === 0 ? -1 : 1) * (layout === 1 ? 10 : 5),
  };
}

export function arrangeLayers(layers: Layer[], size: AssetSize, layout: LayoutIndex) {
  const ordered = [...layers].reverse().sort((a, b) => roleOrder(a) - roleOrder(b));
  const region = layout === 2 ? TITLE_RECT : FRAME_RECT;
  const positioned = ordered.reduce<{ layer: Layer; box: Rectangle; role: Layer["role"] }[]>((placed, layer, index) => {
    const anchor = ordered.length > 6 ? gridAnchor(index, ordered.length, layout) : ANCHORS[layout][index];
    const result = place({ ...layer, ...anchor }, size, region, placed);
    placed.push({ ...result, role: layer.role });
    return placed;
  }, []);
  const byId = new Map(positioned.map(({ layer }) => [layer.id, layer]));
  return layers.map((layer) => byId.get(layer.id) ?? layer);
}

const roleOrder = ({ role }: Layer) => role === "focus" ? 0 : role === "support" ? 1 : 2;

export function newLayers(ids: AssetId[], size: AssetSize, layout: LayoutIndex) {
  const layers = ids.map<Layer>((assetId, index) => ({
    id: `auto-${index}`,
    assetId,
    variant: index >= 3 ? "background" : "main",
    role: index === 0 ? "focus" : index < 3 ? "support" : "background",
    x: 0, y: 0, size: 0, angle: 0,
  }));
  return arrangeLayers(layers.reverse(), size, layout);
}
