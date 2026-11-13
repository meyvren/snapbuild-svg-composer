import { ASSET_LIBRARY, type AssetId, type AssetVariant } from "../../types/types";

export const FRAME = { width: 1200, height: 630 };

export const CATALOG = Object.fromEntries(ASSET_LIBRARY.map((asset) => [asset.id, asset])) as {
  [Id in AssetId]: Extract<(typeof ASSET_LIBRARY)[number], { id: Id }>;
};

export type Role = "focus" | "support" | "background";

export type Layer = {
  id: string;
  assetId: AssetId;
  variant: AssetVariant;
  role: Role;
  x: number;
  y: number;
  size: number;
  angle: number;
};

export type Point = Pick<Layer, "x" | "y">;

export const ROLE_LABELS: Record<Role, string> = {
  focus: "Главный",
  support: "Дополнительный",
  background: "Фоновый",
};

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function layerDimensions(layer: Layer, source: { width: number; height: number }) {
  const scale = layer.size / Math.max(source.width, source.height);
  return { width: source.width * scale, height: source.height * scale };
}

export function layerTransform({ x, y, angle }: Layer) {
  return `translate(${x} ${y}) rotate(${angle})`;
}

export function moveLayer(layers: Layer[], id: string, direction: -1 | 1): Layer[] {
  const index = layers.findIndex((layer) => layer.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= layers.length) return layers;
  const next = [...layers];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
