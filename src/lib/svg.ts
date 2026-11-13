import { ASSET_LIBRARY, PALETTES, assetUrl, type AssetId, type AssetSize, type AssetVariant, type PaletteId } from "../../types/types";
import { FRAME, layerDimensions, layerTransform, type Layer } from "./scene";

type SvgAsset = { body: string; viewBox: string; width: number; height: number; fill: string };
export type ArtSet = Record<AssetVariant, Record<AssetId, SvgAsset>> & { backgrounds: Record<PaletteId, SvgAsset> };
type SceneArt = { layers: Record<AssetVariant, Record<AssetId, SvgAsset>>; background: SvgAsset };

export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];
export const backgroundUrl = (size: AssetSize, palette: PaletteId) => `/assets/${size}/backgrounds/${palette}.svg`;

const cache = new Map<string, Promise<SvgAsset>>();

async function readSvg(url: string): Promise<SvgAsset> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Не удалось загрузить ${url}`);
  const document = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
  const root = document.documentElement;
  const viewBox = root.getAttribute("viewBox") ?? "";
  const values = viewBox.trim().split(/[\s,]+/).map(Number);
  const [, , width, height] = values;
  if (root.localName !== "svg" || document.querySelector("parsererror") || values.length !== 4 ||
    !values.every(Number.isFinite) || !(width > 0 && height > 0)) {
    throw new Error(`Некорректный SVG ${url}`);
  }
  return { body: root.innerHTML, viewBox, width, height, fill: root.getAttribute("fill") ?? "black" };
}

function loadSvg(url: string) {
  const cached = cache.get(url);
  if (cached) return cached;
  const pending = readSvg(url).catch((error) => {
    cache.delete(url);
    throw error;
  });
  cache.set(url, pending);
  return pending;
}

async function loadVariant(size: AssetSize, variant: AssetVariant) {
  const entries = await Promise.all(ASSET_LIBRARY.map(async ({ id }) => [id, await loadSvg(assetUrl(id, size, variant))] as const));
  return Object.fromEntries(entries) as Record<AssetId, SvgAsset>;
}

export async function loadArt(size: AssetSize): Promise<ArtSet> {
  const [main, background, backgrounds] = await Promise.all([
    loadVariant(size, "main"),
    loadVariant(size, "background"),
    Promise.all(PALETTE_IDS.map(async (id) => [id, await loadSvg(backgroundUrl(size, id))] as const)),
  ]);
  return { main, background, backgrounds: Object.fromEntries(backgrounds) as Record<PaletteId, SvgAsset> };
}

function paletteColor(color: string, palette: PaletteId) {
  const index = PALETTES.lavender.findIndex((original) => original === color.toUpperCase());
  return index < 0 ? color : PALETTES[palette][index];
}

export function recolorSvg(body: string, palette: PaletteId) {
  return body.replace(/(\s(?:fill|stroke|stop-color)=["'])(#[\da-f]{6})(?=["'])/gi,
    (_, attribute: string, color: string) => attribute + paletteColor(color, palette));
}

export function colorArt(art: ArtSet, palette: PaletteId): SceneArt {
  const recolor = (variant: AssetVariant) => Object.fromEntries(ASSET_LIBRARY.map(({ id }) => {
    const source = art[variant][id];
    return [id, { ...source, body: recolorSvg(source.body, palette), fill: paletteColor(source.fill, palette) }];
  })) as Record<AssetId, SvgAsset>;
  return { background: art.backgrounds[palette], layers: { main: recolor("main"), background: recolor("background") } };
}

// Local IDs need a unique scope when nested SVGs share a document.
function scopedBody(body: string, scope: string) {
  return body.replace(/(\sid=["']|url\(#|\b(?:xlink:)?href=["']#)([\w:.-]+)/g, `$1${scope}-$2`);
}

export function svgFragment(asset: SvgAsset, scope: string, width: number, height: number, isBackground = false) {
  const x = isBackground ? 0 : -width / 2;
  const y = isBackground ? 0 : -height / 2;
  const aspect = isBackground ? "none" : "xMidYMid meet";
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${asset.viewBox}" fill="${asset.fill}" preserveAspectRatio="${aspect}" overflow="hidden">${scopedBody(asset.body, scope)}</svg>`;
}

export function backgroundFragment(art: SceneArt) {
  return svgFragment(art.background, "frame-background", FRAME.width, FRAME.height, true);
}

export function layerFragment(layer: Layer, art: SceneArt) {
  const asset = art.layers[layer.variant][layer.assetId];
  const { width, height } = layerDimensions(layer, asset);
  return svgFragment(asset, `asset-${layer.id}`, width, height);
}

export function exportSvg(layers: Layer[], art: SceneArt, size: AssetSize) {
  const multiplier = size === "L" ? 2 : 1;
  const objects = layers.map((layer) => `<g transform="${layerTransform(layer)}">${layerFragment(layer, art)}</g>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME.width * multiplier}" height="${FRAME.height * multiplier}" viewBox="0 0 ${FRAME.width} ${FRAME.height}" overflow="hidden">${backgroundFragment(art)}${objects.join("")}</svg>`;
}

export function downloadSvg(markup: string, size: AssetSize) {
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `snapbuild-${size.toLowerCase()}.svg`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
