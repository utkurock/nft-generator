"use client";

import { calculateMaxRandomCombinations } from "@/lib/combinations";
import { useStore } from "@/lib/store";

const formatNumber = (n: number) =>
  n >= 10_000 ? n.toLocaleString("en-US") : String(n).padStart(2, "0");

export function TierStats() {
  const legendaryCount = useStore((s) => s.legendaryAssets.length);
  const totalSupply = useStore((s) => s.settings.totalSupply);
  const layers = useStore((s) => s.layers);
  const antiRules = useStore((s) => s.antiRules);

  const randomRequested = Math.max(0, totalSupply - legendaryCount);
  const maxRandom = calculateMaxRandomCombinations(layers, antiRules);
  const maxUnique = legendaryCount + maxRandom;
  const exceeded = randomRequested > maxRandom && layers.length > 0;

  const stats = [
    { label: "Legendary (1/1)", value: legendaryCount, color: "text-amber-arcade" },
    { label: "Random", value: randomRequested, color: "text-sky-arcade" },
    {
      label: "Max Unique",
      value: maxUnique,
      color: exceeded ? "text-danger" : "text-cream",
    },
    { label: "Total", value: totalSupply, color: "text-gold" },
  ];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-panel px-4 py-5 text-center">
            <div className={`font-display text-3xl font-bold ${s.color}`}>
              {formatNumber(s.value)}
            </div>
            <div className="mt-1 font-display text-[10px] uppercase tracking-widest text-cream-dim">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {exceeded && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/60 bg-danger/10 px-5 py-3">
          <span className="font-display text-base text-danger">⚠</span>
          <div className="flex-1 text-xs text-cream">
            <div className="mb-1 font-display text-[10px] uppercase tracking-widest text-danger">
              Supply exceeds max unique combinations
            </div>
            <p className="text-cream-dim">
              Requesting <strong className="text-cream">{randomRequested.toLocaleString("en-US")}</strong>{" "}
              random NFTs but only{" "}
              <strong className="text-cream">{maxRandom.toLocaleString("en-US")}</strong>{" "}
              unique combinations are possible with current layers
              {antiRules.length > 0 ? " and anti-rules" : ""}. The collection
              will come up short or contain duplicates. Add more assets, more
              layers, or reduce total supply.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
