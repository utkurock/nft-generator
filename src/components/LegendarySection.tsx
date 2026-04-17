"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { LegendaryAsset } from "@/lib/types";

const toLegendary = async (file: File): Promise<LegendaryAsset> => {
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: "image/png" });
  return {
    name: file.name.replace(/\.png$/i, ""),
    blob,
    objectUrl: URL.createObjectURL(blob),
  };
};

export function LegendarySection() {
  const legendaryAssets = useStore((s) => s.legendaryAssets);
  const addLegendaries = useStore((s) => s.addLegendaries);
  const removeLegendary = useStore((s) => s.removeLegendary);
  const updateLegendaryName = useStore((s) => s.updateLegendaryName);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const pngs = Array.from(files).filter((f) => f.type === "image/png");
    if (pngs.length === 0) return;
    const loaded = await Promise.all(pngs.map(toLegendary));
    addLegendaries(loaded);
  };

  return (
    <section className="rounded-xl border border-border bg-panel/80 p-6 shadow-sm backdrop-blur-sm">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-amber-arcade bg-base px-3 py-1 font-display text-[10px] uppercase tracking-widest text-amber-arcade">
          ★ Legendary
        </span>
        <div>
          <h2 className="font-display text-sm uppercase tracking-widest text-gold">
            1/1 Unique NFTs
          </h2>
          <p className="mt-1 text-xs text-cream-dim">
            Fully unique, hand-crafted NFTs. Each one is singular and cannot be repeated.
          </p>
        </div>
      </header>

      <div
        className={`mb-4 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
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
        <div className="mb-2 font-display text-2xl text-amber-arcade">★</div>
        <p className="font-display text-xs uppercase tracking-wider text-cream-dim">
          Drag 1/1 Legendary PNG files or click to upload
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

      {legendaryAssets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {legendaryAssets.map((asset, i) => (
            <div
              key={`${asset.name}-${i}`}
              className="group relative overflow-hidden rounded-lg border-2 border-amber-arcade bg-panel-2"
            >
              <button
                onClick={() => removeLegendary(i)}
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
              <div className="p-1.5">
                <input
                  className="w-full rounded border border-border bg-panel px-1.5 py-1 text-xs text-cream outline-none focus:border-amber-arcade"
                  value={asset.name}
                  onChange={(e) => updateLegendaryName(i, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
