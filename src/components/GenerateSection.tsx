"use client";

import { useState } from "react";
import { generateCollection, GenerationError } from "@/lib/generator";
import { useStore } from "@/lib/store";
import type { Tier } from "@/lib/types";

interface PreviewItem {
  src: string;
  label: string;
  tier: Tier;
}

export function GenerateSection() {
  const settings = useStore((s) => s.settings);
  const layers = useStore((s) => s.layers);
  const legendaryAssets = useStore((s) => s.legendaryAssets);
  const antiRules = useStore((s) => s.antiRules);

  const [running, setRunning] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);

  const tierBorder: Record<Tier, string> = {
    Legendary: "border-2 border-amber-arcade",
    Random: "border border-border",
  };

  const start = async () => {
    setRunning(true);
    setPreviews([]);
    setProgressPct(0);
    setProgressText("Preparing...");

    try {
      const zipBlob = await generateCollection(
        { settings, layers, legendaryAssets, antiRules },
        {
          onProgress: (phase, current, total) => {
            setProgressText(phase);
            if (total > 0) setProgressPct((current / total) * 100);
          },
          onPreview: (src, label, tier) => {
            setPreviews((prev) => [...prev, { src, label, tier }]);
          },
          onZipProgress: (percent, phase) => {
            setProgressPct(percent);
            setProgressText(phase);
          },
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${settings.collectionName.replace(/\s+/g, "_")}_NFT.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setProgressText("Done! Collection downloaded.");
    } catch (e) {
      if (e instanceof GenerationError) {
        alert(e.message);
      } else {
        console.error(e);
        alert("An error occurred during generation.");
      }
      setProgressText("");
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <section className="rounded-xl border border-gold/40 bg-panel/80 p-8 text-center shadow-sm backdrop-blur-sm">
        <button
          onClick={start}
          disabled={running}
          className="rounded-full bg-gold px-10 py-3 font-display text-sm uppercase tracking-widest text-base transition hover:bg-amber-arcade disabled:cursor-not-allowed disabled:opacity-40"
        >
          ▶ Generate Collection ({settings.totalSupply} NFTs)
        </button>

        {running || progressText ? (
          <div className="mt-6">
            <div className="h-2 overflow-hidden rounded-full border border-border bg-panel-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-amber-arcade transition-all"
                style={{ width: `${progressPct.toFixed(0)}%` }}
              />
            </div>
            <div className="mt-2 font-display text-[10px] uppercase tracking-widest text-cream-dim">
              {progressText}
            </div>
          </div>
        ) : null}
      </section>

      {previews.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="font-display text-sm uppercase tracking-widest text-gold">
            ⟶ Preview
          </h2>
          <div className="grid max-h-[500px] grid-cols-3 gap-2.5 overflow-y-auto rounded-xl border border-border bg-panel/50 p-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8">
            {previews.map((p, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={i}
                src={p.src}
                alt={p.label}
                title={p.label}
                className={`aspect-square w-full rounded-lg bg-base object-contain ${tierBorder[p.tier]}`}
              />
            ))}
            {previews.length >= 30 && settings.totalSupply > previews.length && (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border-strong bg-panel/60">
                <span className="font-display text-2xl font-bold text-gold">
                  +{settings.totalSupply - previews.length}
                </span>
                <span className="font-display text-[9px] uppercase tracking-widest text-cream-dim">
                  more in ZIP
                </span>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
