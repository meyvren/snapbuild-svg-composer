"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ASSET_LIBRARY, PALETTES, assetUrl, type AssetId, type AssetSize, type PaletteId } from "../../types/types";
import { matchInput, type MatchMode } from "@/lib/matching";
import { arrangeLayers, LAYOUTS, newLayers, type LayoutIndex } from "@/lib/placement";
import { CATALOG, FRAME, moveLayer, type Layer } from "@/lib/scene";
import { colorArt, downloadSvg, exportSvg, loadArt, PALETTE_IDS, type ArtSet } from "@/lib/svg";
import { Canvas } from "./canvas";
import { Icon } from "./icon";
import { Inspector } from "./inspector";

const EXAMPLES = {
  meaning: ["Вырастить идею", "Финансовая подушка", "Открыть новую главу"],
  objects: ["Книга, лампа, растение", "Телефон и наушники", "Монета, кошелёк, папка"],
};

const PALETTE_LABELS: Record<PaletteId, string> = { lavender: "Лаванда", peach: "Персик", mint: "Мята" };

type LoadState = { size: AssetSize; art?: ArtSet; error?: boolean };

export function Composer() {
  const [mode, setMode] = useState<MatchMode>("meaning");
  const [input, setInput] = useState(EXAMPLES.meaning[0]);
  const [size, setSize] = useState<AssetSize>("S");
  const [palette, setPalette] = useState<PaletteId>("lavender");
  const [layout, setLayout] = useState<LayoutIndex>(0);
  const [layers, setLayers] = useState(() => newLayers(matchInput(EXAMPLES.meaning[0], "meaning").ids, "S", 0));
  const [selectedId, setSelectedId] = useState<string | null>("auto-0");
  const [feedback, setFeedback] = useState<{ text: string; error: boolean }>();
  const [load, setLoad] = useState<LoadState>();
  const [retry, setRetry] = useState(0);
  const nextId = useRef(1);

  useEffect(() => {
    let current = true;
    loadArt(size).then(
      (art) => { if (current) setLoad({ size, art }); },
      () => { if (current) setLoad({ size, error: true }); },
    );
    return () => { current = false; };
  }, [size, retry]);

  const source = load?.size === size ? load.art : undefined;
  const art = useMemo(() => source && colorArt(source, palette), [source, palette]);
  const selected = layers.find(({ id }) => id === selectedId);
  const outputScale = size === "L" ? 2 : 1;

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { ids, unknown } = matchInput(input, mode);
    if (!ids.length) {
      const text = !input.trim() ? "Введите запрос для сборки." : mode === "objects"
        ? `В библиотеке нет совпадений${unknown.length ? ` для «${unknown.join(", ")}»` : ""}.`
        : "Подходящие объекты не найдены. Уточните тему или укажите предметы из библиотеки.";
      setFeedback({ text, error: true });
      return;
    }
    setLayers(newLayers(ids, size, layout));
    setSelectedId("auto-0");
    setFeedback(unknown.length ? { text: `Пропущены неизвестные слова — ${unknown.join(", ")}.`, error: false } : undefined);
  }

  function selectLayout(next: LayoutIndex) {
    setLayout(next);
    setLayers((current) => arrangeLayers(current, size, next));
  }

  function shuffleLayout() {
    const seed = Math.floor(Math.random() * 2 ** 32);
    setLayers((current) => arrangeLayers(current, size, layout, seed));
  }

  function updateLayer(id: string, patch: Partial<Layer>) {
    setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, ...patch } : layer));
  }

  function duplicate() {
    if (!selected) return;
    const id = `manual-${nextId.current++}`;
    setLayers((current) => {
      const index = current.findIndex((layer) => layer.id === selected.id);
      if (index < 0) return current;
      const layer = current[index];
      return [...current.slice(0, index + 1), { ...layer, id, x: layer.x + 24, y: layer.y + 24 }, ...current.slice(index + 1)];
    });
    setSelectedId(id);
  }

  function remove() {
    if (!selected) return;
    setLayers((current) => current.filter((layer) => layer.id !== selected.id));
    setSelectedId(null);
  }

  function addAsset(assetId: AssetId) {
    const id = `manual-${nextId.current++}`;
    const offset = ((layers.length % 5) - 2) * 20;
    setLayers((current) => [...current, {
      id, assetId, role: current.length ? "support" : "focus", variant: "main",
      x: FRAME.width / 2 + offset, y: FRAME.height / 2 + offset, size: 240, angle: 0,
    }]);
    setSelectedId(id);
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand"><span className="brand-mark"><Icon name="spark" size={19} /></span>Snapbuild</div>
          <button className="button export-button" type="button" disabled={!art} onClick={() => art && downloadSvg(exportSvg(layers, art, size), size)}><Icon name="download" size={17} /> Скачать SVG</button>
        </div>
      </header>
      <main className="workspace">
        <div className="workspace-heading">
          <h1>SVG-компоновщик</h1>
          <p>Соберите иллюстрацию по идее или списку объектов.</p>
        </div>
        <div className="editor-grid">
          <section className="panel setup" aria-label="Настройки композиции">
            <div className="panel-heading"><Icon name="spark" /><h2>Композиция</h2></div>
            <form className="setup-form" onSubmit={generate}>
              <div className="segmented mode-control" role="group" aria-label="Режим подбора">
                <button type="button" aria-pressed={mode === "meaning"} onClick={() => { setMode("meaning"); setFeedback(undefined); }}>По смыслу</button>
                <button type="button" aria-pressed={mode === "objects"} onClick={() => { setMode("objects"); setFeedback(undefined); }}>По объектам</button>
              </div>
              <label className="input-label" htmlFor="prompt">{mode === "meaning" ? "Метафора или заголовок" : "Список объектов"}</label>
              <textarea id="prompt" value={input} maxLength={600} placeholder={EXAMPLES[mode][0]}
                onChange={(event) => { setInput(event.target.value); setFeedback(undefined); }} />
              <div className="examples" aria-label="Примеры запросов">
                {EXAMPLES[mode].map((example) => <button type="button" key={example} onClick={() => { setInput(example); setFeedback(undefined); }}>{example}</button>)}
              </div>
              {feedback && <p className={`feedback${feedback.error ? " error" : ""}`} role="status">{feedback.text}</p>}
              <button className="button generate-button" type="submit"><Icon name="spark" size={17} /> Собрать композицию</button>
            </form>
            <div className="setup-appearance">
              <div className="size-row"><h3>Размер SVG</h3><div className="segmented size-control" role="group" aria-label="Размер SVG">
                {(["S", "L"] as const).map((option) => <button type="button" key={option} aria-pressed={size === option} onClick={() => setSize(option)}>{option}</button>)}
              </div></div>
              <div className="palette-heading"><h3>Палитра</h3><span>{PALETTE_LABELS[palette]}</span></div>
              <div className="palette-options" role="group" aria-label="Палитра">
                {PALETTE_IDS.map((id) => <button type="button" key={id} className="swatch" aria-label={PALETTE_LABELS[id]} title={PALETTE_LABELS[id]} aria-pressed={palette === id} onClick={() => setPalette(id)}>
                  <span style={{ background: PALETTES[id][0] }} /><span style={{ background: PALETTES[id][2] }} /><span style={{ background: PALETTES[id][4] }} />
                </button>)}
              </div>
            </div>
          </section>

          <section className="panel canvas-panel" aria-label="Холст и варианты раскладки">
            <div className="panel-heading canvas-heading"><Icon name="frame" /><h2>Холст</h2><span className="dimensions">{FRAME.width * outputScale} × {FRAME.height * outputScale}</span></div>
            <div className="canvas-stage">
              {art ? <Canvas art={art} layers={layers} selectedId={selectedId} onSelect={setSelectedId} onMove={updateLayer} /> : (
                <div className="canvas-placeholder" style={{ backgroundColor: PALETTES[palette][0] }}>
                  {load?.size === size && load.error ? <><p role="alert">Не удалось загрузить SVG-библиотеку.</p><button className="button export-button" type="button" onClick={() => { setLoad(undefined); setRetry((value) => value + 1); }}>Повторить</button></> : <p role="status">Загрузка SVG…</p>}
                </div>
              )}
            </div>
            <div className="canvas-footer">
              <div className="layout-options" role="group" aria-label="Вариант расположения">
                {LAYOUTS.map((name, index) => <button type="button" key={name} aria-pressed={layout === index} onClick={() => selectLayout(index as LayoutIndex)}>{name}</button>)}
              </div>
              <div className="layout-actions">
                <button className="button" type="button" disabled={!layers.length} onClick={() => selectLayout(((layout + 1) % LAYOUTS.length) as LayoutIndex)}>Следующий вариант</button>
                <button className="button" type="button" disabled={!layers.length} onClick={shuffleLayout}><Icon name="shuffle" size={16} /> Перемешать объекты</button>
              </div>
            </div>
          </section>

          <Inspector size={size} layers={layers} selected={selected} onSelect={setSelectedId}
            onChange={(patch) => { if (selected) updateLayer(selected.id, patch); }}
            onReorder={(direction) => { if (selected) setLayers((current) => moveLayer(current, selected.id, direction)); }}
            onDuplicate={duplicate} onRemove={remove} />
        </div>

        <section className="panel library" aria-label="Библиотека объектов">
          <div className="panel-heading"><Icon name="grid" /><h2>Библиотека</h2><span className="count">{ASSET_LIBRARY.length}</span></div>
          <div className="library-grid">
            {ASSET_LIBRARY.map(({ id, name }) => (
              <button type="button" className="library-item" key={id} onClick={() => addAsset(id)} aria-label={`Добавить: ${CATALOG[id].name}`}>
                <span className="library-thumb" style={{ backgroundImage: `url(${assetUrl(id, size)})` }} aria-hidden="true" />
                <span>{name}</span><span className="library-add"><Icon name="plus" size={13} /></span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
