"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { Asset, Layer } from "@/lib/types";

interface Props {
  layer: Layer;
  index: number;
  total: number;
}

const clampRarity = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value * 10) / 10));

const stepBtnClass =
  "flex h-5 w-5 items-center justify-center rounded border border-border text-cream-dim text-[11px] leading-none transition hover:border-gold hover:text-gold active:bg-panel";

const toAsset = async (file: File): Promise<Asset> => {
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: "image/png" });
  return {
    name: file.name.replace(/\.png$/i, ""),
    rarity: 0,
    blob,
    objectUrl: URL.createObjectURL(blob),
  };
};

export function LayerCard({ layer, index, total }: Props) {
  const {
    moveLayer,
    removeLayer,
    updateLayerName,
    toggleOptional,
    updateNoneRarity,
    addAssetsToLayer,
    removeAsset,
    updateRarity,
    updateAssetName,
  } = useStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const pngs = Array.from(files).filter((f) => f.type === "image/png");
    if (pngs.length === 0) return;
    const assets = await Promise.all(pngs.map(toAsset));
    addAssetsToLayer(layer.id, assets);
  };

  const rarityTotal =
    layer.assets.reduce((s, a) => s + a.rarity, 0) +
    (layer.optional ? layer.noneRarity : 0);
  const rarityDiff = Math.abs(rarityTotal - 100);
  const rarityOk = rarityDiff <= 0.05 && layer.assets.length > 0;
  const rarityWarn = rarityDiff > 0.05 && layer.assets.length > 0;

  const posLabel =
    index === 0
      ? "Bottom (Background)"
      : index === total - 1
      ? "Top (Foreground)"
      : "Middle";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel/80 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-panel-2/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-strong text-cream-dim transition hover:border-gold hover:text-gold"
            onClick={() => moveLayer(layer.id, -1)}
            title="Move up"
          >
            ▲
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-strong text-cream-dim transition hover:border-gold hover:text-gold"
            onClick={() => moveLayer(layer.id, 1)}
            title="Move down"
          >
            ▼
          </button>
          <span className="font-display text-[10px] uppercase tracking-widest text-gold">
            #{index + 1} · {posLabel}
          </span>
          <input
            className="w-48 rounded-md border border-transparent bg-transparent px-2 py-1 font-display text-sm text-cream outline-none transition focus:border-gold focus:bg-panel-2"
            value={layer.name}
            onChange={(e) => updateLayerName(layer.id, e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 font-display text-[10px] uppercase tracking-wider text-cream-dim">
            <input
              type="checkbox"
              className="accent-gold"
              checked={layer.optional}
              onChange={(e) => toggleOptional(layer.id, e.target.checked)}
            />
            Optional
          </label>
          <button
            className="rounded-full border border-danger bg-base px-3 py-1 font-display text-[10px] uppercase tracking-wider text-danger transition hover:bg-danger hover:text-cream"
            onClick={() => removeLayer(layer.id)}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        <div
          className={`mb-4 cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition ${
            dragOver
              ? "border-gold bg-gold/10"
              : "border-border-strong bg-panel-2/50 hover:border-gold/60"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFiles(e.dataTransfer.files);
          }}
        >
          <div className="mb-1 font-display text-xl text-gold">▲</div>
          <p className="font-display text-xs uppercase tracking-wider text-cream-dim">
            Drag PNG files or click to upload
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/png"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {layer.optional && (
            <div className="flex min-h-[7rem] items-center justify-center rounded-lg border-2 border-dashed border-border-strong bg-panel-2/50 p-2.5">
              <div>
                <div className="mb-1 text-center font-display text-[10px] uppercase tracking-wider text-cream-dim">
                  None
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    className={stepBtnClass}
                    title="-0.1%"
                    onClick={() =>
                      updateNoneRarity(
                        layer.id,
                        clampRarity(layer.noneRarity - 0.1)
                      )
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={layer.noneRarity}
                    onChange={(e) =>
                      updateNoneRarity(layer.id, parseFloat(e.target.value) || 0)
                    }
                    className="w-12 rounded-md border border-border bg-panel px-1 py-0.5 text-center text-sm text-cream outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    className={stepBtnClass}
                    title="+0.1%"
                    onClick={() =>
                      updateNoneRarity(
                        layer.id,
                        clampRarity(layer.noneRarity + 0.1)
                      )
                    }
                  >
                    +
                  </button>
                  <span className="text-xs text-cream-dim">%</span>
                </div>
              </div>
            </div>
          )}
          {layer.assets.map((asset, ai) => (
            <div
              key={`${asset.name}-${ai}`}
              className="group relative overflow-hidden rounded-lg border border-border bg-panel-2"
            >
              <button
                onClick={() => removeAsset(layer.id, ai)}
                className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-cream opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.objectUrl}
                alt={asset.name}
                className="aspect-square w-full bg-base object-contain"
              />
              <div className="p-2">
                <input
                  className="mb-1 w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-cream outline-none transition focus:border-gold focus:bg-panel"
                  value={asset.name}
                  title={asset.name}
                  onChange={(e) =>
                    updateAssetName(layer.id, ai, e.target.value)
                  }
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={stepBtnClass}
                    title="-0.1%"
                    onClick={() =>
                      updateRarity(
                        layer.id,
                        ai,
                        clampRarity(asset.rarity - 0.1)
                      )
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={asset.rarity}
                    onChange={(e) =>
                      updateRarity(
                        layer.id,
                        ai,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-12 rounded-md border border-border bg-panel px-1 py-0.5 text-center text-xs text-cream outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    className={stepBtnClass}
                    title="+0.1%"
                    onClick={() =>
                      updateRarity(
                        layer.id,
                        ai,
                        clampRarity(asset.rarity + 0.1)
                      )
                    }
                  >
                    +
                  </button>
                  <span className="text-xs text-cream-dim">%</span>
                </div>
                <div className="mt-1.5 h-[3px] overflow-hidden rounded bg-panel">
                  <div
                    className="h-full rounded bg-gradient-to-r from-gold to-amber-arcade"
                    style={{ width: `${Math.min(asset.rarity, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {rarityWarn && (
          <div className="mt-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-1.5 font-display text-[10px] uppercase tracking-wider text-danger">
            Total: {rarityTotal.toFixed(1)}% —{" "}
            {rarityTotal < 100
              ? `${(100 - rarityTotal).toFixed(1)}% under`
              : `${(rarityTotal - 100).toFixed(1)}% over`}
          </div>
        )}
        {rarityOk && (
          <div className="mt-3 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 font-display text-[10px] uppercase tracking-wider text-gold">
            Total: 100% ✓
          </div>
        )}
      </div>
    </div>
  );
}
