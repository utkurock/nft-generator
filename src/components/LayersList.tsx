"use client";

import { useStore } from "@/lib/store";
import { LayerCard } from "./LayerCard";

export function LayersList() {
  const layers = useStore((s) => s.layers);
  const addLayer = useStore((s) => s.addLayer);
  const clearAll = useStore((s) => s.clearAll);

  const confirmClear = () => {
    if (
      confirm(
        "All layers, legendaries and rules will be deleted. Are you sure?"
      )
    ) {
      clearAll();
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-sm uppercase tracking-widest text-gold">
          ⟶ Layers
        </h2>
        <span className="text-xs text-cream-dim">
          #1 = bottom, last = top · traits distributed proportionally by rarity
        </span>
        <button
          className="rounded-full bg-gold px-4 py-1.5 font-display text-[10px] uppercase tracking-widest text-base transition hover:bg-amber-arcade"
          onClick={addLayer}
        >
          + Add Layer
        </button>
        <button
          className="ml-auto rounded-full border border-border-strong bg-base px-4 py-1.5 font-display text-[10px] uppercase tracking-widest text-cream-dim transition hover:border-gold hover:text-gold"
          onClick={confirmClear}
        >
          Clear All
        </button>
      </div>

      {layers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-panel/50 py-10 text-center font-display text-xs uppercase tracking-widest text-cream-dim">
          No layers added yet
        </div>
      ) : (
        <div className="space-y-4">
          {layers.map((layer, idx) => (
            <LayerCard
              key={layer.id}
              layer={layer}
              index={idx}
              total={layers.length}
            />
          ))}
        </div>
      )}
    </section>
  );
}
