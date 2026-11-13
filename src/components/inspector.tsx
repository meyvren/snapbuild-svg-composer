import { useState } from "react";
import { assetUrl, type AssetSize, type AssetVariant } from "../../types/types";
import { CATALOG, ROLE_LABELS, type Layer } from "@/lib/scene";
import { Icon } from "./icon";

type InspectorProps = {
  size: AssetSize;
  layers: Layer[];
  selected?: Layer;
  onSelect: (id: string) => void;
  onChange: (patch: Partial<Pick<Layer, "x" | "y" | "size" | "angle" | "variant">>) => void;
  onReorder: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

function Coordinate({ axis, value, onChange }: { axis: "X" | "Y"; value: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState<string>();

  return (
    <label className="number-field">
      <span>{axis}</span>
      <input type="number" step="any" aria-label={axis} value={draft ?? Math.round(value)}
        onChange={(event) => {
          setDraft(event.currentTarget.value);
          const next = event.currentTarget.valueAsNumber;
          if (Number.isFinite(next)) onChange(next);
        }}
        onBlur={() => setDraft(undefined)} />
    </label>
  );
}

export function Inspector({ size, layers, selected, onSelect, onChange, onReorder, onDuplicate, onRemove }: InspectorProps) {
  const selectedIndex = layers.findIndex((layer) => layer.id === selected?.id);

  return (
    <aside className="panel inspector" aria-label="Редактор слоёв">
      <div className="panel-heading"><Icon name="layers" /><h2>Слои</h2><span className="count">{layers.length}</span></div>
      <div className="layer-list">
        {[...layers].reverse().map((layer) => (
          <button type="button" key={layer.id} className="layer-row" aria-pressed={selected?.id === layer.id} onClick={() => onSelect(layer.id)}>
            <span className="layer-thumb" style={{ backgroundImage: `url(${assetUrl(layer.assetId, size, layer.variant)})` }} aria-hidden="true" />
            <span className="layer-text"><strong>{CATALOG[layer.assetId].name}</strong><small>{ROLE_LABELS[layer.role]}</small></span>
            {selected?.id === layer.id && <Icon name="check" size={15} />}
          </button>
        ))}
        {!layers.length && <p className="empty-label">Добавьте объект из библиотеки или соберите композицию.</p>}
      </div>
      <div className="layer-actions">
        <button type="button" className="icon-button" title="Поднять слой" aria-label="Поднять слой" disabled={!selected || selectedIndex === layers.length - 1} onClick={() => onReorder(1)}><Icon name="up" size={17} /></button>
        <button type="button" className="icon-button" title="Опустить слой" aria-label="Опустить слой" disabled={!selected || selectedIndex <= 0} onClick={() => onReorder(-1)}><Icon name="down" size={17} /></button>
        <button type="button" className="icon-button" title="Дублировать слой" aria-label="Дублировать слой" disabled={!selected} onClick={onDuplicate}><Icon name="copy" size={16} /></button>
        <button type="button" className="icon-button danger" title="Удалить слой" aria-label="Удалить слой" disabled={!selected} onClick={onRemove}><Icon name="trash" size={16} /></button>
      </div>
      <div className="panel-heading properties-heading"><Icon name="sliders" /><h2>Свойства</h2></div>
      {selected ? (
        <div className="properties">
          <div className="position-fields">
            <Coordinate key={`${selected.id}-x`} axis="X" value={selected.x} onChange={(x) => onChange({ x })} />
            <Coordinate key={`${selected.id}-y`} axis="Y" value={selected.y} onChange={(y) => onChange({ y })} />
          </div>
          <label className="slider-field">
            <span>Масштаб <output>{Math.round(selected.size)} px</output></span>
            <input type="range" min="8" max="840" step="1" value={selected.size} onChange={(event) => onChange({ size: event.currentTarget.valueAsNumber })} />
          </label>
          <label className="slider-field">
            <span>Поворот <output>{selected.angle}°</output></span>
            <input type="range" min="-180" max="180" step="1" value={selected.angle} onChange={(event) => onChange({ angle: event.currentTarget.valueAsNumber })} />
          </label>
          <label className="variant-field">
            <span>Оформление</span>
            <select value={selected.variant} onChange={(event) => onChange({ variant: event.target.value as AssetVariant })}>
              <option value="main">Основное</option>
              <option value="background">Фоновое</option>
            </select>
          </label>
        </div>
      ) : <p className="empty-label properties">Выберите слой на холсте или в списке.</p>}
    </aside>
  );
}
