"use client";

import { useMemo, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { CATALOG, FRAME, layerDimensions, layerTransform, type Layer, type Point } from "@/lib/scene";
import { backgroundFragment, layerFragment, type colorArt } from "@/lib/svg";

type CanvasProps = {
  art: ReturnType<typeof colorArt>;
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, point: Point) => void;
};

function CanvasObject({ layer, art, onStart, onFocus, onKey }: {
  layer: Layer;
  art: CanvasProps["art"];
  onStart: (event: PointerEvent<SVGGElement>, layer: Layer) => void;
  onFocus: CanvasProps["onSelect"];
  onKey: (event: KeyboardEvent, layer: Layer) => void;
}) {
  const markup = layerFragment(layer, art);
  const content = useMemo(() => ({ __html: markup }), [markup]);
  return <g className="canvas-layer" role="group" tabIndex={0} aria-label={CATALOG[layer.assetId].name}
    onFocus={() => onFocus(layer.id)} onPointerDown={(event) => onStart(event, layer)}
    onKeyDown={(event) => onKey(event, layer)} transform={layerTransform(layer)} dangerouslySetInnerHTML={content} />;
}

export function Canvas({ art, layers, selectedId, onSelect, onMove }: CanvasProps) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; pointerId: number; offset: Point } | null>(null);
  const background = useMemo(() => ({ __html: backgroundFragment(art) }), [art]);

  function toCanvas(event: PointerEvent): Point | null {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }

  function startDrag(event: PointerEvent<SVGGElement>, layer: Layer) {
    if (!event.isPrimary || event.button !== 0) return;
    const point = toCanvas(event);
    if (!point) return;
    event.stopPropagation();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(layer.id);
    drag.current = { id: layer.id, pointerId: event.pointerId, offset: { x: layer.x - point.x, y: layer.y - point.y } };
  }

  function moveDrag(event: PointerEvent) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const point = toCanvas(event);
    if (point) onMove(active.id, { x: Math.round(point.x + active.offset.x), y: Math.round(point.y + active.offset.y) });
  }

  function clearDrag(event: PointerEvent) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  function moveByKey(event: KeyboardEvent, layer: Layer) {
    const shift = event.shiftKey ? 10 : 1;
    const deltas: Record<string, Point> = {
      ArrowLeft: { x: -shift, y: 0 }, ArrowRight: { x: shift, y: 0 },
      ArrowUp: { x: 0, y: -shift }, ArrowDown: { x: 0, y: shift },
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    onMove(layer.id, { x: layer.x + delta.x, y: layer.y + delta.y });
  }

  const selected = layers.find(({ id }) => id === selectedId);
  const selectedDimensions = selected && layerDimensions(selected, art.layers[selected.variant][selected.assetId]);

  return (
    <svg ref={svg} className="artboard" viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} aria-label="Холст иллюстрации"
      onPointerDown={() => onSelect(null)} onPointerMove={moveDrag} onPointerUp={clearDrag}
      onPointerCancel={clearDrag} onLostPointerCapture={clearDrag}>
      <g aria-hidden="true" dangerouslySetInnerHTML={background} />
      {layers.map((layer) => (
        <CanvasObject key={layer.id} layer={layer} art={art} onStart={startDrag} onFocus={onSelect} onKey={moveByKey} />
      ))}
      {selected && selectedDimensions && (
        <g transform={layerTransform(selected)} aria-hidden="true" pointerEvents="none" className="selection-outline">
          <rect x={-selectedDimensions.width / 2} y={-selectedDimensions.height / 2}
            width={selectedDimensions.width} height={selectedDimensions.height} fill="none" vectorEffect="non-scaling-stroke" />
        </g>
      )}
    </svg>
  );
}
